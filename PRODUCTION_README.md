# Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables
Ensure these are set in your production environment:

```bash
# Required
VITE_SUPABASE_URL="your-production-supabase-url"
VITE_SUPABASE_ANON_KEY="your-production-supabase-anon-key"

# Optional (for captcha)
CLOUDFLARE_TURNSTILE_SECRET="your-turnstile-secret"
PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY="your-turnstile-site-key"

# Security Settings (optional)
VITE_ADMIN_MAX_LOGIN_ATTEMPTS="5"
VITE_ADMIN_LOCKOUT_DURATION="900000"
VITE_ADMIN_SESSION_TIMEOUT="28800000"
VITE_ADMIN_INACTIVITY_TIMEOUT="1800000"
```

### 2. Database Setup
Run these migrations in your production Supabase database:

```sql
-- Add password column to moderators table
ALTER TABLE public.moderators ADD COLUMN password text;

-- Add RLS policies for moments table
CREATE POLICY "Allow admin updates to moments"
ON moments FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin deletions of moments"
ON moments FOR DELETE
TO authenticated, anon
USING (true);

-- Add RLS policies for moderators table
CREATE POLICY "Allow admin inserts to moderators"
ON moderators FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow admin updates to moderators"
ON moderators FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin deletions of moderators"
ON moderators FOR DELETE
TO authenticated, anon
USING (true);

CREATE POLICY "Allow admin viewing of moderators"
ON moderators FOR SELECT
TO authenticated, anon
USING (true);
```

### 3. Security Configuration
- ✅ Bcrypt password hashing implemented
- ✅ Rate limiting (5 attempts, 15-minute lockout)
- ✅ Session timeout (8 hours)
- ✅ Inactivity timeout (30 minutes)
- ✅ Security headers configured

## 🚀 Deployment Platforms

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `build`

### Manual Deployment
```bash
npm run build
# Deploy the 'build' directory to your hosting provider
```

## 🔒 Security Best Practices

### 1. Access Control
- Use strong, unique passwords for admin accounts
- Regularly rotate admin passwords
- Limit admin access to trusted volunteers only
- Consider IP whitelisting for admin access

### 2. Monitoring
- Monitor login attempts and failed logins
- Set up alerts for suspicious activity
- Regularly review admin user list
- Monitor database access patterns

### 3. Backup Strategy
- Enable automatic Supabase backups
- Test backup restoration procedures
- Keep multiple backup copies
- Document recovery procedures

## 📊 Performance Optimization

### 1. Build Optimizations
- Code splitting implemented
- Vendor chunks separated
- Terser minification enabled
- Tree shaking active

### 2. Caching Strategy
- Static assets cached
- API responses cached where appropriate
- Browser caching headers configured

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure all variables are prefixed with `VITE_`
   - Check for typos in variable names
   - Verify deployment platform configuration

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies are applied
   - Ensure database migrations are run

3. **Admin Login Problems**
   - Verify password column exists in moderators table
   - Check bcrypt hashing is working
   - Clear browser session storage if needed

### Debug Mode
For debugging, set `NODE_ENV=development` in your environment variables.

## 📞 Support

For production issues:
1. Check the logs in your deployment platform
2. Verify environment variables are correct
3. Test database connectivity
4. Review security settings

## 🔄 Updates & Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security settings quarterly
- [ ] Backup database weekly
- [ ] Monitor performance metrics
- [ ] Review admin user access

### Emergency Procedures
1. **Security Breach**: Immediately change all admin passwords
2. **Database Issues**: Restore from latest backup
3. **Performance Problems**: Check resource usage and optimize
4. **Access Issues**: Verify environment variables and permissions
