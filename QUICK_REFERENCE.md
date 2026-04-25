# Quick Reference Guide

## Essential Commands

```bash
# First time setup
pnpm install                    # Install dependencies
pnpm run verify-db             # Check database connection
pnpm dev                       # Start dev server (http://localhost:3000)

# Database
pnpm run setup-db              # Initialize database (alternative to manual SQL)
pnpm run verify-db             # Verify database is ready

# Development
pnpm dev                       # Start dev server with hot reload
pnpm build                     # Build for production
pnpm start                     # Start production server
pnpm lint                      # Check code style
```

## Project Structure

```
notion-clone/
├── app/
│   ├── layout.tsx              # Root layout with auth provider
│   ├── page.tsx                # Landing page
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── workspaces/             # Workspaces list
│   └── workspace/
│       └── [workspaceId]/      # Workspace editor
│           ├── page.tsx        # Document editor
│           └── database/       # Database views
├── components/
│   ├── rich-text-editor.tsx    # TipTap editor
│   ├── database-table.tsx      # Table view
│   ├── board-view.tsx          # Kanban board
│   ├── gallery-view.tsx        # Gallery view
│   └── calendar-view.tsx       # Calendar view
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── auth-context.tsx        # Auth state management
│   ├── supabase-client.ts      # Client-side Supabase
│   ├── supabase-server.ts      # Server-side Supabase
│   └── use-realtime.ts         # Real-time subscriptions
├── scripts/
│   ├── 01-init-database.sql    # Database schema
│   ├── setup-db.mjs            # Setup script
│   └── verify-db.mjs           # Verification script
└── docs/
    ├── README.md               # Project overview
    ├── GETTING_STARTED.md      # Getting started guide
    ├── DATABASE_SETUP.md       # Database setup
    ├── SETUP_CHECKLIST.md      # Step-by-step checklist
    ├── DEPLOYMENT.md           # Deploy to production
    └── TROUBLESHOOTING.md      # Common issues
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (Supabase keys) |
| `scripts/01-init-database.sql` | Database schema |
| `lib/auth-context.tsx` | User auth state |
| `lib/types.ts` | TypeScript type definitions |
| `app/layout.tsx` | Root layout with providers |

## Environment Variables

```bash
# Copy this to .env.local and fill in your values:
NEXT_PUBLIC_SUPABASE_URL=https://db.facadidhognljvafbcii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Get these from:** Supabase Dashboard → Settings → API

## Common Development Tasks

### Add a new page
1. Create `app/new-page/page.tsx`
2. Use the auth context: `const { user } = useAuth()`
3. Export default component

### Add a new database field type
1. Update `lib/types.ts` - add to `DatabaseField` type
2. Update `scripts/01-init-database.sql` - add to field creation logic
3. Update database views to handle new type

### Enable real-time updates
```tsx
import { useRealtime } from '@/lib/use-realtime'

// Subscribe to table changes
useRealtime('pages', (payload) => {
  // Handle updates
})
```

## Deployment Checklist

- [ ] Set environment variables in production
- [ ] Run database migrations
- [ ] Test auth flow in production
- [ ] Enable HTTPS
- [ ] Set up custom domain
- [ ] Configure Supabase security rules
- [ ] Enable backups
- [ ] Set up monitoring

See **DEPLOYMENT.md** for detailed instructions.

## Getting Help

- **Setup issues?** → Read `SETUP_CHECKLIST.md`
- **Database problems?** → Read `DATABASE_SETUP.md`
- **Common errors?** → Read `TROUBLESHOOTING.md`
- **Architecture questions?** → Read `BUILD_SUMMARY.md`
- **Deployment help?** → Read `DEPLOYMENT.md`

## Key Features Checklist

- [x] User authentication (signup/login)
- [x] Workspace creation and management
- [x] Document editor with rich text
- [x] Database creation with custom fields
- [x] Multiple view types (Table, Board, Gallery, Calendar)
- [x] Team collaboration (invite members)
- [x] Real-time updates with Supabase
- [x] Row-level security
- [x] Role-based access control
- [x] Full TypeScript support

## Next: Read SETUP_CHECKLIST.md to get started!
