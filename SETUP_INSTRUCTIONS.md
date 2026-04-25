# Setup Instructions for Notion Clone

## Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account with a project created
- Your Supabase credentials (URL and API keys)

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings > API** (left sidebar)
4. Copy these three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 2: Set Environment Variables

The system already requested your credentials. They should be set in your project's environment variables.

**Or manually create `.env.local`:**

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 3: Install Dependencies

```bash
pnpm install
```

## Step 4: Initialize the Database

Run the database setup script to create all tables:

```bash
pnpm run setup-db
```

You should see output like:
```
🚀 Initializing Notion Clone Database...
📌 Supabase URL: https://your-project.supabase.co
📋 Running 50+ SQL statements...
✓ Executed: create extension if not exists...
✓ Executed: create table workspaces...
[... more statements ...]
✅ Database initialization complete!
```

**Alternative: Manual SQL Setup**

If the script doesn't work, manually run the SQL:

1. Go to Supabase Dashboard → SQL Editor
2. Click "New query"
3. Open `/scripts/01-init-database.sql` and copy all the SQL
4. Paste into the SQL Editor and click "Run"

## Step 5: Start the Development Server

```bash
pnpm dev
```

This starts the Next.js dev server at `http://localhost:3000`

## Step 6: Test the Application

1. Open `http://localhost:3000` in your browser
2. Click **Sign Up** to create an account
3. Sign in with your new account
4. Create your first workspace
5. Start creating pages and databases!

## Troubleshooting

### "Supabase credentials missing" error
- Check `.env.local` exists with all three keys
- Make sure you copied the values correctly (no extra spaces)
- Restart the dev server after adding env variables

### Database connection failed
- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that `SUPABASE_SERVICE_ROLE_KEY` has the right format (it's very long)
- Go to Supabase Dashboard → Authentication → Policies to check RLS is enabled

### "Auth error" when signing up
- Check email format is valid
- Try a different email address
- Go to Supabase Dashboard → Authentication → Users to see if the user was created

### Tables not found error
- Run `pnpm run setup-db` again
- Or manually run the SQL from `/scripts/01-init-database.sql` in Supabase SQL Editor

For more help, see **TROUBLESHOOTING.md**

## Next: Deploy

Once local testing works, you can deploy:

- **Vercel** - See `DEPLOYMENT.md` → Vercel section
- **Docker** - See `DEPLOYMENT.md` → Docker section
- **Self-hosted** - See `DEPLOYMENT.md` → Self-hosted section

## Project Structure

```
notion-clone/
├── app/                    # Next.js pages and layouts
│   ├── layout.tsx          # Root layout with auth provider
│   ├── page.tsx            # Landing page
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── workspaces/         # Workspaces list
│   └── workspace/          # Workspace editor
├── components/             # React components
│   ├── rich-text-editor.tsx
│   ├── database-table.tsx
│   ├── board-view.tsx
│   ├── gallery-view.tsx
│   ├── calendar-view.tsx
│   └── workspace-members.tsx
├── lib/                    # Utilities and hooks
│   ├── supabase-client.ts  # Client-side Supabase setup
│   ├── supabase-server.ts  # Server-side Supabase setup
│   ├── auth-context.tsx    # Auth context provider
│   ├── types.ts            # TypeScript types
│   └── use-realtime.ts     # Real-time subscription hook
├── scripts/                # Database scripts
│   └── 01-init-database.sql
└── public/                 # Static files
```

## Key Features Available

✅ User authentication (email/password)
✅ Workspace management with role-based access
✅ Rich text document editor
✅ Database tables with custom fields
✅ Multiple database views (Table, Board, Gallery, Calendar)
✅ Team collaboration and invitations
✅ Real-time presence and updates
✅ Row-level security for data protection

## Support

- Read documentation in order:
  1. This file (Setup)
  2. `README.md` (Overview)
  3. `GETTING_STARTED.md` (Features)
  4. `DEPLOYMENT.md` (Production)
  5. `TROUBLESHOOTING.md` (Issues)

Happy coding! 🚀
