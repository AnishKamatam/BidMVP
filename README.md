# BidMVP

A Next.js mobile interface with Supabase authentication.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can get these from your [Supabase project dashboard](https://app.supabase.com) under Settings > API.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- 📱 Mobile-optimized interface
- 🔐 Supabase authentication (sign up, log in, sign out)
- 🎨 Inter font family
- ✨ Clean, modern UI with sharp edges
- 🎭 Modal-based auth flow
- 🎯 Consistent design system

## Project Structure

```
├── app/
│   ├── layout.js        # Root layout with AuthProvider
│   ├── page.js          # Main page with auth modals
│   └── globals.css      # Global styles
├── components/
│   └── AuthModal.js     # Reusable auth modal component
├── contexts/
│   └── AuthContext.js   # Auth context provider
├── lib/
│   └── supabase/        # Supabase client utilities
│       ├── client.js    # Browser client
│       ├── server.js    # Server client
│       └── middleware.js # Middleware helper
└── middleware.js        # Next.js middleware for auth

