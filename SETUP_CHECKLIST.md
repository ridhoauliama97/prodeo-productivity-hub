# Setup Checklist for Notion Clone

Complete these steps to get your Notion clone running locally:

## ✅ Step 1: Environment Variables (5 min)
- [x] You provided Supabase credentials
- [ ] Verify `.env.local` has these variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://db.facadidhognljvafbcii.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  ```

**Where to find these keys:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click **Settings** → **API**
4. Copy the keys into `.env.local`

## ✅ Step 2: Initialize Database (3 min)

### Option A: Manual SQL (Recommended for most users)
1. Go to Supabase SQL Editor
2. Create a new query
3. Copy contents of `scripts/01-init-database.sql` from your project
4. Run the query
5. Wait for success message

### Option B: Automated Setup (if available)
```bash
pnpm install
pnpm run setup-db
```

## ✅ Step 3: Verify Setup (1 min)
```bash
pnpm run verify-db
```

You should see all tables listed as ✅

## ✅ Step 4: Install Dependencies (3 min)
```bash
pnpm install
```

## ✅ Step 5: Start Development Server (ongoing)
```bash
pnpm dev
```

Open http://localhost:3000

## ✅ Step 6: Test the Application (5 min)

- [ ] Create an account (Sign up)
- [ ] Create a workspace
- [ ] Create a document and edit it
- [ ] Create a database
- [ ] Add fields to the database
- [ ] Try different view types (Table, Board, Gallery, Calendar)
- [ ] Invite a team member (optional)

## 🎉 You're Done!

Your Notion clone is now running. Here's what's available:

| Feature | URL | How to use |
|---------|-----|-----------|
| Landing page | `http://localhost:3000` | Main entry point |
| Sign up | `http://localhost:3000/signup` | Create account |
| Login | `http://localhost:3000/login` | Sign in |
| Workspaces | `http://localhost:3000/workspaces` | Manage teams |
| Editor | `http://localhost:3000/workspace/[id]` | Edit documents |
| Database | `http://localhost:3000/workspace/[id]/database/[id]` | Create tables |

## 🐛 Troubleshooting

### "Table already exists" when running SQL
**This is normal!** Just continue. The tables might already be created.

### Cannot connect to Supabase
- Check your `.env.local` file has the correct URLs and keys
- Make sure your Supabase project is active
- Try the `pnpm run verify-db` command to debug

### Port 3000 already in use
```bash
# Use a different port
pnpm dev -- -p 3001
```

### Dependencies won't install
```bash
# Clear cache and reinstall
pnpm install --force
```

### See DATABASE_SETUP.md for more detailed setup instructions

## 📚 Next Steps

- Read **README.md** for project overview
- Check **DEPLOYMENT.md** for production deployment
- Explore **BUILD_SUMMARY.md** to understand the architecture
- Review **DOCUMENTATION_INDEX.md** for all available guides
