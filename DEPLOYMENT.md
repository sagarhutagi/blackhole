# Black Hole - Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel/Netlify account (or any hosting provider)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd UniVerse
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### 3. Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### 5. Preview Production Build

```bash
npm run preview
```

## Deployment Options

### Option A: Deploy on Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy

```bash
npm i -g vercel
vercel --prod
```

### Option B: Deploy on Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect your repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables
7. Deploy

### Option C: Deploy on Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t black-hole .
docker run -p 3000:3000 black-hole
```

### Option D: Deploy on AWS

Using AWS Amplify:

1. Install Amplify CLI: `npm install -g @aws-amplify/cli`
2. Initialize: `amplify init`
3. Add hosting: `amplify add hosting`
4. Deploy: `amplify publish`

## Database Setup

1. Go to your Supabase project
2. Execute the SQL from `supabase_schema.sql` in the SQL editor
3. Verify all tables are created

## Post-Deployment Checklist

- [ ] Test authentication (login/signup)
- [ ] Test message posting
- [ ] Test real-time updates
- [ ] Verify Hall of Fame displays correctly
- [ ] Test on mobile devices
- [ ] Check console for errors
- [ ] Verify environment variables are set
- [ ] Test rate limiting (if applicable)
- [ ] Monitor performance

## Performance Optimization Tips

1. **Enable Compression**: Ensure GZIP is enabled on your server
2. **CDN**: Use a CDN to serve static assets
3. **Database Indexing**: Ensure all indexes are in place (already done in schema)
4. **Lazy Loading**: Components are already code-split
5. **Caching**: Set appropriate cache headers

## Monitoring

### Supabase Monitoring
- Check Supabase Dashboard for database performance
- Monitor API rate limits
- Review authentication logs

### Application Monitoring
- Use Sentry for error tracking
- Set up uptime monitoring
- Track user analytics

## Troubleshooting

### Build Fails
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check Node version: `node --version` (should be 18+)

### Environment Variables Not Loading
- Check `.env.local` file exists and has correct variables
- Restart dev server
- For production, verify variables in hosting provider dashboard

### Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check if JWT secret is properly configured
- Ensure RLS policies allow required operations

### Real-time Updates Not Working
- Verify Realtime is enabled in Supabase
- Check WebSocket connection in browser DevTools
- Ensure table policies allow real-time subscriptions

## Support

For issues and questions:
1. Check GitHub Issues
2. Review Supabase documentation
3. Check browser console for errors
4. Enable debug mode in environment variables

## Security Considerations

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Rotate Supabase keys** periodically
3. **Enable RLS** on all tables (already done)
4. **Use HTTPS only** in production
5. **Implement rate limiting** for API endpoints
6. **Keep dependencies updated**: `npm audit` and `npm update`

## Scaling Considerations

- Monitor database performance
- Implement caching for frequently accessed data
- Consider implementing pagination for large datasets
- Use database connection pooling if needed

---

Last Updated: November 2025
