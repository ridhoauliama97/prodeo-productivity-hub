# Notion Clone - Quick Start (5 Minutes)

## What You Need

- Your Supabase credentials (should be set already)
- Node.js 18+, pnpm installed
- A terminal

## Commands (Copy & Paste)

```bash
# 1. Install dependencies
pnpm install

# 2. Initialize database
pnpm run setup-db

# 3. Start dev server
pnpm dev
```

## That's It!

Open http://localhost:3000 in your browser

### First Time Setup

1. Click **Sign Up**
2. Enter email and password
3. Create a **New Workspace**
4. Start creating documents!

## What Works

✅ **Documents** - Create and edit rich text pages
✅ **Databases** - Create tables with custom fields
✅ **Database Views** - Switch between Table, Board, Gallery, Calendar
✅ **Teams** - Invite members to workspaces
✅ **Real-time** - See changes from other users live

## Features to Try

1. **Create a Document**
   - Go to workspace → Click "New Page" → Type a title → Start editing

2. **Create a Database**
   - Go to workspace → Select "Database" in dropdown → Create table
   - Add fields (Text, Number, Date, Select, etc.)
   - Switch between views (Table, Board, Gallery, Calendar)

3. **Invite Team Members**
   - Click workspace settings → Members → Invite by email

4. **Enable Collaboration**
   - Open the same page in multiple browser tabs
   - See real-time updates as you edit

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find .env.local" | Env vars already set. If error persists, create `.env.local` with Supabase credentials |
| "Auth error" | Check email format, try different email |
| "Database error" | Run `pnpm run setup-db` again |
| "Port 3000 in use" | Run `pnpm dev -- -p 3001` to use port 3001 |

## Next Steps

- Read `SETUP_INSTRUCTIONS.md` for detailed setup
- Read `GETTING_STARTED.md` for feature overview
- Read `DEPLOYMENT.md` to deploy to production

## Important Files

- `lib/auth-context.tsx` - Authentication logic
- `app/workspace/[workspaceId]/page.tsx` - Main editor
- `components/rich-text-editor.tsx` - Document editor
- `components/database-table.tsx` - Database views
- `scripts/01-init-database.sql` - Database schema

## Environment Variables

If you need to set them manually:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Editor**: TipTap
- **UI**: shadcn/ui, Tailwind CSS

## Need Help?

1. Check `TROUBLESHOOTING.md`
2. Read `DEPLOYMENT.md` for production
3. Read `DOCUMENTATION_INDEX.md` for all docs

You're ready to build! 🚀
