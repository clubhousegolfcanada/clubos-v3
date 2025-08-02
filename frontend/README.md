# ClubOS V3 Frontend

Mobile-first operator interface for ClubOS V3.

## Setup

1. Copy `.env.example` to `.env.local`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:3000

## Pages

- `/` - Thread list (home)
- `/threads/:id` - Thread detail with actions
- `/tickets` - Ticket list
- `/tickets/create` - Create ticket
- `/admin/sops` - SOP management (admin only)
- `/login` - Operator login

## Deployment

Deploy to Vercel:
1. Connect GitHub repo
2. Set environment variables
3. Deploy