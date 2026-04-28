# Play for Good

A comprehensive charity-driven golf platform that combines score tracking, monthly prize draws, and automated charity donations. Players submit their Stableford scores, enter monthly draws to win prizes, and contribute to their chosen charities—all in one seamless experience.

## Features

### User Features
- **Score Submission**: Track your last 5 Stableford scores using the Rolling 5 system
- **Monthly Draws**: Automatic entry into monthly draws when you submit 5 valid scores
- **Prize Matching**: Match 3, 4, or 5 numbers to win prizes from the monthly pool
- **Charity Selection**: Choose your preferred charity and set donation percentage (minimum 10%)
- **Winner Verification**: Upload proof documents for prize claims
- **Real-time Notifications**: View draw results and winner announcements
- **Prize Pool Tracking**: Monitor available, reserved, and distributed prize pools
- **Subscription Management**: Manage your monthly subscription via Stripe

### Admin Features
- **Admin Dashboard**: Comprehensive analytics and system overview
- **User Management**: View, edit, and promote users to admin status
- **Draw Engine**: Execute monthly draws with Random or Weighted algorithms
- **Charity Registry**: Manage charity partners and featured status
- **Winner Verification**: Review and approve winner claims with proof documents
- **Prize Pool Management**: Track and manage prize distributions
- **Real-time Statistics**: Monitor active subscribers, pending payouts, and total pools

### Security & Transparency
- **Verified Payouts**: All winners must upload proof documents for verification
- **Transparent Prize Pools**: Real-time tracking of available and reserved funds
- **Secure Authentication**: Supabase-powered auth with profile management
- **Admin Controls**: Role-based access control for administrative functions

## Tech Stack

### Frontend
| Technology | Purpose |
| :--- | :--- |
| React 18 | UI Library |
| Vite | Build Tool & Dev Server |
| TypeScript | Type Safety |
| Tailwind CSS | Utility-first Styling |
| Framer Motion | Animations |
| Lucide React | Icon Library |
| React Router | Client-side Routing |
| Supabase Client | Authentication & Database |
| Stripe.js | Payment Processing |

### Backend
| Technology | Purpose |
| :--- | :--- |
| Node.js | Runtime Environment |
| Express | Web Framework |
| TypeScript | Type Safety |
| Supabase | Database & Auth |
| Stripe | Payment & Subscription Management |
| Nodemailer | Email Notifications |
| Multer | File Upload Handling |

## Project Structure

```text
digitalheroes-assignment/
├── frontend/                 # React Frontend (Vite + TypeScript)
│   └── src/
│       ├── components/       # Reusable UI Components
│       ├── pages/            # Page Components
│       │   ├── admin/        # Admin Portal Pages
│       │   ├── Dashboard.tsx
│       │   ├── Charities.tsx
│       │   ├── MyWins.tsx
│       │   ├── Notifications.tsx
│       │   └── Subscription.tsx
│       ├── context/          # React Context (Auth)
│       ├── api/              # API Client Configuration
│       └── lib/              # Supabase Client
│
└── backend/                  # Node.js Backend (Express + TypeScript)
    └── src/
        ├── controllers/      # API Controllers
        ├── routes/           # API Route Handlers
        ├── services/         # Business Logic
        ├── middleware/       # Auth & Validation
        └── utils/            # Helper Functions
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account (for database & auth)
- Stripe Account (for payments)
- ngrok (for local webhook testing)

### Environment Variables

#### Backend (`backend/.env`):
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/digitalheroes-assignment
cd digitalheroes-assignment
```

2. Install Backend Dependencies:
```bash
cd backend
npm install
```

3. Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL migrations in your Supabase SQL Editor:
   - Create tables: `profiles`, `scores`, `monthly_draws`, `winners`, `charities`, `subscriptions`, `prize_pools`
   - Set up storage buckets for winner proof uploads
   - Configure storage policies (see `backend/setup_storage_policies.sql`)

3. Seed initial data:
```bash
cd backend
npm run seed:charities
npm run seed:prize-pools
```

## Running Locally

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:3000`

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
Client runs on `http://localhost:5173`

### Terminal 3 - Stripe Webhooks (for local testing):
```bash
ngrok http 3000
# Copy the ngrok URL and update Stripe webhook endpoint
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login user | Public |
| GET | /api/auth/profile | Get user profile | Protected |

### Scores
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | /api/scores | Submit new score | Protected |
| GET | /api/scores | Get user scores | Protected |
| DELETE | /api/scores/:id | Delete score | Protected |

### Draws
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | /draws/generate | Generate monthly draw | Admin |
| POST | /draws/:id/publish | Publish draw results | Admin |
| GET | /draws/results | Get published draws | Protected |

### Charities
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | /api/charities | Get all charities | Protected |
| POST | /api/charities | Create charity | Admin |
| PUT | /api/charities/:id | Update charity | Admin |
| DELETE | /api/charities/:id | Delete charity | Admin |
| POST | /api/charities/select | Select user charity | Protected |

### Winners
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | /api/winners/my-wins | Get user wins | Protected |
| POST | /api/winners/:id/upload-proof | Upload proof document | Protected |
| GET | /admin/winners | Get all winners | Admin |
| PUT | /admin/winners/:id/verify | Verify winner | Admin |

### Subscriptions
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | /api/subscriptions/create-checkout | Create Stripe checkout | Protected |
| POST | /webhooks/stripe | Handle Stripe webhooks | Public |
| GET | /api/subscriptions/status | Get subscription status | Protected |

### Admin
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | /admin/stats | Get dashboard stats | Admin |
| GET | /admin/users | Get all users | Admin |
| PUT | /admin/users/:id | Update user | Admin |
| GET | /admin/draws | Get all draws | Admin |

## Key Features Explained

### Draw System
- **Random Algorithm**: Equal probability for all eligible participants
- **Weighted Algorithm**: Higher scores get better odds
- **Match Types**: 5-match (40% pool), 4-match (30% pool), 3-match (20% pool)
- **Eligibility**: Must have 5 valid scores submitted for the month

### Prize Pool Distribution
- **Total Pool**: Sum of all subscription contributions
- **Reserved Pool**: Allocated to approved winners awaiting payout
- **Available Pool**: Ready for next draw distribution
- **Charity Allocation**: Minimum 10% of each subscription goes to user's chosen charity

### Winner Verification Flow
1. User wins in monthly draw
2. User uploads proof document (bank statement, ID, etc.)
3. Admin reviews and verifies proof
4. Admin marks as paid after transfer
5. Amount moves from reserved to paid pool
