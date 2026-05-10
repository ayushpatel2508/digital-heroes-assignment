import rateLimit from 'express-rate-limit';

// Global Rate Limiter: Applies to all standard API routes
// Limit: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict Rate Limiter: For sensitive routes like authentication or high-cost writes
// Limit: 10 requests per 10 minutes per IP
export const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  message: {
    error: 'Too many requests for this specific action, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
