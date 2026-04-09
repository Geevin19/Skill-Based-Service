# SkillSwap — Peer-to-Peer Skill Learning Platform

## Project Structure

```
skillswap/
├── backend/          Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── db/
│   │   │   └── schema.sql
│   │   ├── utils/
│   │   ├── socket.js
│   │   └── index.js
│   └── .env.example
└── frontend/         React + Vite + Tailwind CSS
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── utils/
    └── .env.example
```

## Local Setup

### 1. PostgreSQL Database

```bash
createdb skillswap
psql -d skillswap -f skillswap/backend/src/db/schema.sql
```

### 2. Backend

```bash
cd skillswap/backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 3. Frontend

```bash
cd skillswap/frontend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

Frontend runs on http://localhost:5173  
Backend runs on http://localhost:5000

---

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for signing JWTs |
| EMAIL_USER / EMAIL_PASS | SMTP credentials for Nodemailer |
| STRIPE_SECRET_KEY | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret |
| CLIENT_URL | Frontend URL (http://localhost:5173) |

### Frontend `.env`
| Variable | Description |
|---|---|
| VITE_API_URL | Backend URL (http://localhost:5000) |
| VITE_STRIPE_PUBLISHABLE_KEY | Stripe publishable key |

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | — | Register |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/verify-email | — | Verify email |
| POST | /api/auth/forgot-password | — | Request reset |
| POST | /api/auth/reset-password | — | Reset password |
| GET | /api/auth/me | JWT | Get current user |
| GET | /api/users/mentors | — | List/search mentors |
| GET | /api/users/:id | — | Get profile |
| PUT | /api/users/profile | JWT | Update profile |
| PUT | /api/users/switch-role | JWT | Switch role |
| GET/POST | /api/sessions | JWT/Mentor | Sessions CRUD |
| GET/POST | /api/bookings | JWT | Bookings |
| PUT | /api/bookings/:id/status | JWT | Update status |
| GET/POST | /api/chat | JWT | Messages |
| POST | /api/reviews | JWT | Submit review |
| POST | /api/payments/create-intent | JWT | Stripe payment |
| GET | /api/payments/earnings | JWT | Mentor earnings |
| GET | /api/notifications | JWT | Notifications |
| GET | /api/admin/* | Admin | Admin panel |

---

## Deployment

### Frontend → Vercel
```bash
cd skillswap/frontend
npm run build
# Deploy dist/ to Vercel or run: vercel --prod
```

### Backend → Render / Railway
- Set all environment variables in the dashboard
- Start command: `node src/index.js`
- Create a `uploads/` directory or use cloud storage (S3)

---

## Features
- JWT auth with email verification & password reset
- Role-based access: Learner / Mentor / Admin
- Mentor discovery with search & filters
- Session booking with availability calendar
- Real-time chat via Socket.io with file sharing
- WebRTC video calls with screen sharing
- Stripe payment integration
- Review & rating system
- Mentor & Learner dashboards
- Admin panel with user management
- In-app notifications
