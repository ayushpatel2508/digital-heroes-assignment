import { Request, Response } from "express";
import Stripe from "stripe";
import { subscriptionService } from "../services/subscriptionService";
import dotenv from "dotenv";

dotenv.config();

const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY || "");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const stripeController = {
  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(req: Request, res: Response) {
    try {
      const { priceId, userId, email } = req.body;

      if (!priceId || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const session = await (stripe as any).checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer_email: email,
        client_reference_id: userId, // Very important: links Stripe session to our user
        success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/subscription`,
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
      });

      // 🛠️ HACK for local testing without Stripe Webhooks:
      // Instantly mark the user as 'active' locally so they can test scores immediately after checkout
      const isYearly = priceId === process.env.STRIPE_YEARLY_PRICE_ID;
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (isYearly) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      await subscriptionService.upsertSubscription({
        stripeCustomerId: "test_cust_" + userId,
        stripeSubscriptionId: "test_sub_" + Math.random().toString(36).substring(7),
        userId: userId,
        status: "active",
        planType: isYearly ? "yearly" : "monthly",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
      });

      // NEW: Record transaction so local testing updates the prize pool properly
      await subscriptionService.recordPaymentTransaction({
        userId: userId,
        amount: isYearly ? 150 : 15, // Using 15/month and 150/year for testing
        stripePaymentIntentId: "test_pi_" + Math.random().toString(36).substring(7),
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
        planType: isYearly ? "yearly" : "monthly",
      });

      res
        .status(200)
        .json({ sessionId: session.id, url: (session as any).url });
    } catch (error: any) {
      console.error("❌ Error creating checkout session:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  /**
   * Handle Stripe Webhooks
   */
  async handleWebhook(req: Request, res: Response) {
    console.log("🚀 Webhook hit! Checking headers...");
    const sig = req.headers["stripe-signature"] as string;
    let event: any;

    try {
      // Use raw body for signature verification
      event = (stripe as any).webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔔 Received Stripe Event:", event.type);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const subscription = await (stripe as any).subscriptions.retrieve(
            session.subscription as string
          );

          const priceId = subscription.items.data[0].price.id;
          const planType =
            priceId === process.env.STRIPE_YEARLY_PRICE_ID
              ? "yearly"
              : "monthly";

          console.log("📅 Subscription Dates:", {
            start: subscription.current_period_start,
            end: subscription.current_period_end,
          });

          await subscriptionService.upsertSubscription({
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            userId: session.client_reference_id as string,
            status: subscription.status,
            planType: planType,
            currentPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : new Date(),
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : new Date(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });

          // NEW: Record specific transaction for prize pool calculation
          await subscriptionService.recordPaymentTransaction({
            userId: session.client_reference_id as string,
            amount: session.amount_total / 100, // Convert from cents
            stripePaymentIntentId: session.payment_intent as string,
            billingPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : new Date(),
            billingPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : new Date(),
            planType: planType,
          });
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;

          // Find user ID from our record since Stripe Subscription event doesn't always have client_reference_id
          const userId = await subscriptionService.getUserIdByStripeCustomerId(
            subscription.customer as string
          );

          if (userId) {
            const priceId = subscription.items.data[0].price.id;
            const planType =
              priceId === process.env.STRIPE_YEARLY_PRICE_ID
                ? "yearly"
                : "monthly";

            await subscriptionService.upsertSubscription({
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              userId: userId,
              status: subscription.status,
              planType: planType,
              currentPeriodStart: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000)
                : new Date(),
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : new Date(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("❌ Error processing webhook event:", error.message);
      res.status(500).json({ received: false, error: "Internal server error" });
    }
  },

  /**
   * Get user subscription status
   */
  async getUserSubscription(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const subscription = await subscriptionService.getSubscriptionByUserId(
        userId as string
      );

      res.status(200).json(subscription);
    } catch (error: any) {
      console.error("❌ Error fetching subscription status:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
