# Notion Clone - Deployment Guide

This is a fully functional Notion clone application built with Next.js, React, Supabase, and TipTap. It's ready for local deployment and includes all features mentioned in the specification.

## Features

- ✅ **Rich Text Editing**: Document creation with formatting (bold, italic, headings, lists, etc.)
- ✅ **Database Tables**: Create structured data with custom fields
- ✅ **Multiple View Types**: Table, Board, Gallery, and Calendar views
- ✅ **User Authentication**: Sign up and sign in with Supabase Auth
- ✅ **Workspaces**: Organize projects and collaborate with team members
- ✅ **Real-time Collaboration**: Presence tracking and live updates with Supabase Realtime
- ✅ **Role-based Access**: Admin, member, and viewer roles

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Editor**: TipTap rich text editor
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions

## Prerequisites

- Node.js 18+ (use `pnpm` as the package manager)
- A Supabase account and project
- Git (for version control)

## Local Setup Instructions

### 1. Clone/Download the Repository

```bash
cd notion-clone
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Project Settings → API**
3. Copy the following environment variables:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)
   - **JWT Secret** (SUPABASE_JWT_SECRET)
4. Note your **Database Password** for connection strings

### 4. Create Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_ANON_KEY=your_anon_key
POSTGRES_URL=postgresql://postgres:your_password@your_host:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:your_password@your_host:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:your_password@your_host:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=your_host
POSTGRES_DATABASE=postgres
```

### 5. Initialize the Database

1. Go to your Supabase project's SQL Editor
2. Copy the contents of `/scripts/01-init-database.sql`
3. Paste and run it in the SQL editor

Alternatively, if you have the Supabase CLI installed:

```bash
supabase db push
```

### 6. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Usage

### First Time

1. Visit `http://localhost:3000`
2. Click "Get Started" or navigate to `/signup`
3. Create your account
4. Create a workspace
5. Start creating documents and databases!

### Creating Content

**Documents**: Simple rich text pages with formatting options
**Databases**: Structured data with custom fields and multiple view options

### Workspace Collaboration

1. Go to workspace settings (upcoming feature)
2. Invite team members by email
3. Set member roles (Viewer, Member, Admin)
4. Collaborate in real-time

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy

```bash
# From your repository
git push origin main
```

### Option 2: Self-Hosted (Docker)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
```

Build and run:

```bash
docker build -t notion-clone .
docker run -e NEXT_PUBLIC_SUPABASE_URL=... -p 3000:3000 notion-clone
```

### Option 3: AWS/GCP/Azure

Standard Next.js deployment to your cloud provider. See Next.js documentation for detailed instructions.

## API Routes (Extensible)

The application uses Supabase client SDK for all database operations. To add custom API routes:

```typescript
// app/api/your-endpoint/route.ts
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const supabase = await createClient()
  // Your API logic here
}
```

## Database Schema

The database includes these main tables:

- `workspaces` - Workspace definitions
- `workspace_members` - Team members and permissions
- `pages` - Documents/pages and database pages
- `blocks` - Content blocks within pages
- `databases` - Database table definitions
- `database_fields` - Column definitions
- `database_rows` - Table rows with data
- `views` - Different views (table, board, gallery, calendar)
- `presence` - Real-time user presence
- `comments` - Page comments (extensible)

## Performance Tips

1. Enable database query caching with Supabase
2. Use pagination for large datasets
3. Implement virtual scrolling for large tables
4. Optimize images with Next.js Image component
5. Use React.memo for expensive components

## Troubleshooting

### Authentication Issues

- Verify Supabase URL and keys in `.env.local`
- Check if auth is enabled in Supabase settings
- Clear browser cookies and try again

### Database Connection Issues

- Verify PostgreSQL connection string
- Check Supabase network settings
- Ensure firewall allows connections

### Realtime Not Working

- Enable realtime in Supabase for relevant tables
- Check browser console for websocket errors
- Verify table has Row Level Security policies

## Security Considerations

1. **Row Level Security (RLS)**: Already configured for all tables
2. **Environment Variables**: Never commit `.env.local`
3. **API Keys**: Use anon key in frontend, service role key only on backend
4. **CORS**: Configure in Supabase if deploying to different domain
5. **Rate Limiting**: Implement with Supabase or middleware

## Future Enhancements

- [ ] Advanced filtering and sorting UI
- [ ] Database relationships and lookups
- [ ] Form generation from databases
- [ ] File upload and image embedding
- [ ] Advanced sharing and permissions
- [ ] Activity history and version control
- [ ] Full-text search
- [ ] Custom formulas and calculations
- [ ] Webhooks and integrations
- [ ] Dark mode toggle

## Support

For issues or questions:

1. Check Supabase documentation: https://supabase.com/docs
2. Review Next.js documentation: https://nextjs.org/docs
3. See TipTap docs for editor customization: https://tiptap.dev
4. Check application logs: `pnpm dev` terminal output

## License

This project is open source and available for educational and commercial use.

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Run production build
- `pnpm lint` - Run ESLint

---

**Ready to deploy?** Follow the deployment options above to get your instance running!
