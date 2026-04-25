# Notion Clone - Quick Start Guide

A full-featured Notion clone built with Next.js 16, Supabase, and React. Ready to deploy and self-host.

## 🚀 Quick Start (5 Minutes)

### 1. Setup Supabase

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials from:
# https://supabase.com/dashboard
```

### 2. Initialize Database

- Go to your Supabase SQL Editor
- Copy content from `scripts/01-init-database.sql`
- Paste and execute

### 3. Start Development

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000` and sign up!

## 📋 What's Included

### Pages
- **Landing Page** - `/` - Marketing homepage
- **Sign Up** - `/signup` - Create account
- **Sign In** - `/login` - Log in
- **Workspaces** - `/workspaces` - Manage workspaces
- **Workspace Editor** - `/workspace/[id]` - Create documents and databases
- **Database Views** - `/workspace/[id]/database/[id]` - Table/Board/Gallery/Calendar views

### Components
- `RichTextEditor` - Full-featured text editing with TipTap
- `DatabaseTable` - Spreadsheet-style data entry
- `BoardView` - Kanban board visualization
- `GalleryView` - Card grid layout
- `CalendarView` - Event calendar
- `WorkspaceMembers` - Team collaboration

### Authentication
- Email/password sign up
- Email/password login
- Session management
- Row-level security

### Realtime Features
- Presence tracking (who's online)
- Live block updates (coming soon)
- Collaborative cursors (coming soon)

## 📁 Project Structure

```
notion-clone/
├── app/
│   ├── layout.tsx              # Root layout with auth provider
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   ├── workspaces/page.tsx     # Workspaces list
│   └── workspace/[workspaceId]/
│       ├── page.tsx            # Main editor
│       └── database/[pageId]/page.tsx  # Database views
├── components/
│   ├── rich-text-editor.tsx    # TipTap editor
│   ├── database-table.tsx      # Table view
│   ├── board-view.tsx          # Board view
│   ├── gallery-view.tsx        # Gallery view
│   ├── calendar-view.tsx       # Calendar view
│   └── workspace-members.tsx   # Members management
├── lib/
│   ├── types.ts                # TypeScript types
│   ├── auth-context.tsx        # Auth provider
│   ├── supabase-client.ts      # Browser Supabase client
│   ├── supabase-server.ts      # Server Supabase client
│   └── use-realtime.ts         # Realtime hooks
├── scripts/
│   └── 01-init-database.sql    # Database schema
├── public/                      # Static assets
└── .env.example                 # Environment template
```

## 🎯 Key Features Explained

### Document Editing
- Create rich text documents with formatting
- Support for headings, lists, code blocks, quotes
- Undo/redo functionality
- Real-time auto-save

### Databases
- Create database pages with custom fields
- Supported field types: text, number, date, checkbox, select, email, url, phone
- Flexible data entry

### Multiple Views
- **Table**: Spreadsheet-style editing
- **Board**: Kanban-style with grouping
- **Gallery**: Card-based layout
- **Calendar**: Event-based timeline

### Workspaces
- Organize related projects together
- Invite team members
- Set role-based permissions (Viewer, Member, Admin)
- Workspace-scoped content

## 🔐 Security Features

✅ Row-level security (RLS) on all tables
✅ Auth token stored in httpOnly cookies
✅ Secure password hashing
✅ User isolation by workspace
✅ Role-based access control

## 📦 Deployment

### Deploy to Vercel (1 Click)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy!

### Self-Host with Docker

```bash
docker build -t notion-clone .
docker run -e NEXT_PUBLIC_SUPABASE_URL=... -p 3000:3000 notion-clone
```

See `DEPLOYMENT.md` for detailed instructions.

## 🛠️ Development

### Install Dependencies
```bash
pnpm install
```

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
pnpm start
```

### Lint Code
```bash
pnpm lint
```

## 📚 Key Libraries

- **Next.js 16** - React framework with App Router
- **TipTap** - Extensible rich text editor
- **Supabase** - PostgreSQL database + Auth
- **Shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Icon library
- **TypeScript** - Type safety

## 🧠 How It Works

1. **Authentication**: User signs up/logs in with Supabase Auth
2. **Workspaces**: User creates a workspace, becomes owner
3. **Pages**: Within workspace, create documents or database pages
4. **Rich Text**: Documents use TipTap editor for rich formatting
5. **Databases**: Database pages store structured data in Supabase
6. **Views**: Switch between table/board/gallery/calendar views
7. **Realtime**: Supabase subscriptions keep data in sync
8. **Collaboration**: Multiple users can work in same workspace

## 🤝 Collaboration

- Invite team members to workspace
- Set different permission levels
- See who's online (presence)
- Work on same documents simultaneously

## 🐛 Common Issues

**"Supabase connection failed"**
- Check `.env.local` has correct Supabase URL and keys
- Verify database is initialized

**"Auth not working"**
- Ensure Auth is enabled in Supabase dashboard
- Clear browser cookies
- Check Network tab for API errors

**"Realtime updates not working"**
- Enable Realtime in Supabase table settings
- Check browser console for websocket errors
- Verify RLS policies allow reads

## 📖 Documentation

- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
- **TipTap**: https://tiptap.dev
- **Tailwind**: https://tailwindcss.com/docs
- **React**: https://react.dev

## 💡 Tips

1. Use browser DevTools to inspect Realtime connections
2. Test RLS policies in Supabase SQL editor
3. Check Supabase logs for auth/database errors
4. Use cursor pagination for large datasets
5. Implement image optimization for galleries

## 📝 Next Steps

After deployment:

1. Add custom branding (logo, colors)
2. Implement additional view types (Timeline, Spreadsheet)
3. Add templates for common use cases
4. Integrate third-party services (Zapier, etc.)
5. Build mobile app (React Native)
6. Add advanced search
7. Implement version history

## 📄 License

Open source - use freely for personal and commercial projects.

---

**Ready?** Start with `pnpm install && pnpm dev` 🎉
