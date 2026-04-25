# Troubleshooting Guide

## Common Issues & Solutions

### Authentication Issues

#### "Auth not configured" or blank page on login
**Solution:**
1. Verify `.env.local` exists and has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Restart dev server: `pnpm dev`
3. Clear browser cookies: Dev Tools → Application → Cookies → Delete all from localhost

#### "Invalid login credentials"
**Solution:**
1. Make sure you signed up first before trying to log in
2. Check email spelling
3. Password is case-sensitive
4. Try signing up again if account creation failed

#### "Email already exists"
**Solution:**
- That email is already registered
- Try logging in instead of signing up
- Or use a different email

### Database Connection Issues

#### "Failed to connect to database"
**Solution:**
1. Check Supabase project is active (Dashboard → Project Settings)
2. Verify `SUPABASE_URL` in `.env.local`
3. Check internet connection
4. Verify database is initialized (see Setup below)

#### "User cannot view pages"
**Solution:**
1. Check Row Level Security is properly configured
2. Verify user is added to `workspace_members` table
3. Check `SUPABASE_SERVICE_ROLE_KEY` for server operations

### Database Schema Issues

#### "Table doesn't exist" or SQL errors
**Solution:**
1. Initialize database with schema:
   - Go to Supabase Dashboard
   - Click SQL Editor
   - Click "New Query"
   - Copy entire content from `scripts/01-init-database.sql`
   - Click "Run"
   - Wait for success message

2. Or use Supabase CLI:
   ```bash
   supabase db push
   ```

#### "Permission denied" errors
**Solution:**
1. Go to Supabase Dashboard
2. Click "SQL Editor" → "Create new query"
3. Run to enable RLS:
   ```sql
   ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
   -- Repeat for all tables
   ```

### Realtime Issues

#### "Realtime updates not working"
**Solution:**
1. Enable Realtime for tables in Supabase:
   - Dashboard → Replication → Choose tables
   - Toggle "ON" for needed tables

2. Verify browser WebSocket connection:
   - Open Dev Tools → Network → WS (WebSocket)
   - Should see `realtime-*.supabase.co` connections

#### "Presence tracking not updating"
**Solution:**
1. Verify `presence` table exists: `SELECT * FROM presence;`
2. Check RLS policy allows updates
3. Restart browser tab

### Performance Issues

#### "App is slow"
**Solution:**
1. Check database query performance in Supabase:
   - Dashboard → SQL Editor → Run slow queries
   - Add indexes if needed

2. Optimize React rendering:
   - Use browser DevTools Profiler
   - Look for unnecessary re-renders

3. Check network:
   - Dev Tools → Network
   - Look for large payloads
   - Implement pagination for large datasets

#### "High memory usage"
**Solution:**
1. Check for memory leaks in Dev Tools → Memory
2. Unsubscribe from Realtime listeners properly
3. Clear browser cache: `Ctrl+Shift+Delete`

### UI/UX Issues

#### "Editor not working"
**Solution:**
1. Refresh page: `Ctrl+R` or `Cmd+R`
2. Check browser console for JavaScript errors
3. Clear cache: `Ctrl+Shift+Delete`

#### "Page blank or not loading"
**Solution:**
1. Check browser console for errors
2. Verify auth: `curl $NEXT_PUBLIC_SUPABASE_URL/auth/v1/user -H "Authorization: Bearer $TOKEN"`
3. Check network requests in Dev Tools

#### "Views not switching"
**Solution:**
1. Refresh page
2. Check if database has any fields/rows
3. Verify database was created properly

### Deployment Issues

#### "Deployment fails on build"
**Solution:**
1. Check Node version: `node --version` (should be 18+)
2. Clear dependencies:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
3. Check for TypeScript errors: `pnpm tsc --noEmit`

#### "Environment variables not found after deploy"
**Solution:**
1. Verify all vars added in deployment platform settings
2. Restart deployment
3. Check build logs for missing vars

#### "Database connection fails in production"
**Solution:**
1. Use non-pooling connection string for serverless:
   ```
   POSTGRES_URL_NON_POOLING=...
   ```
2. Verify IP whitelist in database settings
3. Check firewall rules

### Browser Compatibility

#### "App doesn't work in Safari"
**Solution:**
1. Check for unsupported JavaScript features
2. Update to latest Safari version
3. Clear Safari cache: Preferences → Privacy → Manage Website Data

#### "Styles not applying"
**Solution:**
1. Check Tailwind CSS builds: `pnpm build`
2. Verify shadcn/ui components imported correctly
3. Check for CSS conflicts

### File Structure Issues

#### "Module not found" errors
**Solution:**
1. Check file exists at specified path
2. Verify imports use correct casing
3. Restart dev server

#### ".env.local file not found"
**Solution:**
1. Create file: `touch .env.local`
2. Copy from template: `cp .env.example .env.local`
3. Add your Supabase credentials

## Debugging Steps

### Enable Debug Logging

Add to your components:
```typescript
console.log("[v0] Event:", eventName, data)
console.log("[v0] State:", currentState)
console.log("[v0] Error:", error.message)
```

### Check Supabase Logs

1. Supabase Dashboard → Logs
2. View recent errors
3. Check auth events
4. Monitor database queries

### Use Browser DevTools

1. **Console Tab**: See JavaScript errors
2. **Network Tab**: Monitor API calls
3. **Application Tab**: Check cookies and local storage
4. **Performance Tab**: Profile slow operations

### Check Environment Variables

```bash
# Verify vars are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Restart after changing .env.local
pnpm dev
```

## Getting More Help

### Documentation
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- TipTap: https://tiptap.dev/guide

### Community
- Supabase Discord: https://discord.supabase.io
- Next.js Discussions: https://github.com/vercel/next.js/discussions

### Issue Tracking
1. Search existing issues first
2. Provide:
   - Error message (exact)
   - Steps to reproduce
   - Browser/OS info
   - Browser console errors

## Performance Checklist

- [ ] Indexes created on frequently searched columns
- [ ] RLS policies optimized
- [ ] Realtime only enabled on needed tables
- [ ] Pagination implemented for large datasets
- [ ] Images optimized with Next.js Image component
- [ ] React.memo used for expensive components
- [ ] Unused dependencies removed

## Security Checklist

- [ ] .env.local not committed to git
- [ ] No API keys in client-side code
- [ ] Service role key only used on server
- [ ] RLS policies prevent unauthorized access
- [ ] CORS configured if using different domain
- [ ] Passwords hashed (handled by Supabase)
- [ ] Session tokens secure (httpOnly cookies)

## Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review browser console errors
3. ✅ Verify environment variables
4. ✅ Test with a fresh browser session
5. ✅ Restart dev server
6. ✅ Check documentation
7. ✅ Search GitHub issues

---

**Still stuck?** Include these details when asking for help:
- Exact error message
- Steps to reproduce
- Browser and OS
- Console output
- `.env.local` (without secrets)
