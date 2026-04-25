# Fixed: SQL Permission Error ✅

## What Was Wrong

You got this error:
```
ERROR: 42501: permission denied to set parameter "app.settings.jwt_secret"
```

This was because the SQL script tried to set a Supabase system parameter that requires admin-level permissions.

## What I Fixed

I removed this problematic line from `scripts/01-init-database.sql`:
```sql
alter database postgres set "app.settings.jwt_secret" to 'your-secret-key';
```

✅ **The fix is now in place. The SQL script is ready to run.**

## How to Run (Fixed Version)

### Option 1: Supabase Web Editor (Recommended)
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy the entire contents of `scripts/01-init-database.sql`
5. Paste into the SQL Editor
6. Click **Run** button
7. Wait for "Query successful" ✅

### Option 2: Using psql CLI
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.facadidhognljvafbcii.supabase.co:5432/postgres" < scripts/01-init-database.sql
```

## What Gets Created

Running the fixed SQL will create:

✅ **9 Tables:**
- workspaces
- workspace_members
- user_profiles
- pages
- blocks
- databases
- database_fields
- database_rows
- views
- comments
- presence

✅ **Row-Level Security (RLS):** All tables have automatic permission checking

✅ **Performance Indexes:** Fast queries on common operations

✅ **Auto-update Triggers:** `updated_at` fields automatically maintain timestamps

## After Running SQL

Once the SQL completes successfully:

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000

## If You Still Get Errors

| Error | Solution |
|-------|----------|
| "Table already exists" | That's fine! It means tables were created. Continue. |
| "Extension uuid-ossp already exists" | That's fine! It's already enabled. Continue. |
| "permission denied" | Check if you're using the correct user account (postgres, not a service role) |

## Troubleshooting

**Q: Can I run the script again?**
A: Yes, it's safe. Tables won't be duplicated (uses `if not exists`).

**Q: Do I need special permissions?**
A: No, just the standard postgres user should work fine.

**Q: What about the JWT secret?**
A: Supabase manages JWT settings automatically. You don't need to set it manually.

## Next Steps

1. Run the fixed SQL in Supabase
2. Run `pnpm install && pnpm dev`
3. Visit http://localhost:3000
4. Sign up and start using your Notion clone!

---

**The SQL script is now fixed and ready to go! 🚀**
