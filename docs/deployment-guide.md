# Deployment Guide

This document outlines the process for deploying the Restaurant Application to production environments.

## Prerequisites

Before deploying, make sure you have:

- A production PostgreSQL database
- A hosting service compatible with Next.js (Vercel, AWS, Netlify, etc.)
- Domain name (optional, but recommended)
- Environment variables properly configured

## Environment Variables

The following environment variables need to be set in your production environment:

```
# Database
DATABASE_URL=postgresql://username:password@production-host:5432/restaurant_db

# NextAuth
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-production-domain.com

# Optional: Email (for notifications)
EMAIL_SERVER=smtp://username:password@smtp-host:587
EMAIL_FROM=noreply@your-restaurant.com
```

Make sure to use appropriate values for your production environment, especially:
- Strong, unique secret keys
- Proper database connection string
- Correct production URL for your domain

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest deployment option since Next.js is built by the same team.

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy the application

**Detailed Steps:**

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. From the dashboard, click "Import Project"
3. Select your Git provider and repository
4. Configure the project:
   - Set the framework preset to "Next.js"
   - Add all environment variables
   - Configure any custom build settings if needed
5. Click "Deploy"
6. Once deployed, verify that all features are working correctly

### Option 2: AWS

For more control over your infrastructure, AWS is a good option.

**Using AWS Amplify:**

1. Push your code to a Git repository
2. Connect your repository to AWS Amplify
3. Configure environment variables in the Amplify console
4. Deploy the application

**Using AWS EC2:**

1. Provision an EC2 instance (recommended: Ubuntu 22.04 LTS, t3.small or larger)
2. Install Node.js, npm, and PM2
3. Set up a PostgreSQL database (using RDS or on the same instance)
4. Clone your repository to the server
5. Build the application:
   ```bash
   cd restaurant
   npm install
   npm run build
   ```
6. Set up environment variables
7. Set up PM2 to manage the Node.js process:
   ```bash
   npm install -g pm2
   pm2 start npm --name "restaurant-app" -- start
   pm2 save
   pm2 startup
   ```
8. Configure Nginx as a reverse proxy:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
9. Set up SSL with Let's Encrypt
10. Configure firewall rules to allow HTTP/HTTPS traffic

### Option 3: Docker Deployment

For containerized deployment:

1. Create a `Dockerfile` in the project root:
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. Create a `docker-compose.yml` file:
   ```yaml
   version: '3'
   services:
     web:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://username:password@db:5432/restaurant_db
         - NEXTAUTH_SECRET=your-secret
         - NEXTAUTH_URL=https://your-domain.com
       depends_on:
         - db
     db:
       image: postgres:14
       volumes:
         - postgres_data:/var/lib/postgresql/data
       environment:
         - POSTGRES_PASSWORD=your-password
         - POSTGRES_USER=username
         - POSTGRES_DB=restaurant_db
   
   volumes:
     postgres_data:
   ```

3. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Database Migration

Before the first deployment to production, you need to run the Prisma migrations:

1. Set the DATABASE_URL to point to your production database
2. Run the migration command:
   ```bash
   npx prisma migrate deploy
   ```

## Seed Production Data

You may want to seed your production database with initial data:

```bash
NODE_ENV=production npm run prisma:seed
```

Note: Make sure the seed script is suitable for production use.

## SSL Setup

For production, always use HTTPS. If you're using a service like Vercel or Netlify, SSL is handled automatically.

For custom deployments:
1. Obtain an SSL certificate (Let's Encrypt is free)
2. Configure your web server to use the SSL certificate
3. Ensure NEXTAUTH_URL starts with "https://"

## Post-Deployment Verification

After deploying, verify that:

1. **Authentication works**:
   - Test login with existing accounts
   - Test registration of new accounts
   - Verify role-based access

2. **Database operations work**:
   - Menu items display correctly
   - Orders can be created and retrieved
   - Reservations can be made

3. **API endpoints are functional**:
   - Test key API endpoints with tools like Postman
   - Verify that authentication protection works

## Monitoring and Maintenance

1. **Set up monitoring**:
   - Application monitoring (New Relic, Datadog, or Sentry)
   - Server monitoring (if using custom deployment)
   - Database monitoring

2. **Regular maintenance**:
   - Database backups (daily, at minimum)
   - Regular updates of dependencies
   - Security patches

3. **Performance optimization**:
   - Enable caching where appropriate
   - Optimize database queries that may slow down with more data

## Rollback Plan

In case of issues with a deployment:

1. **For Vercel/similar platforms**:
   - Roll back to the previous deployment in the dashboard

2. **For custom deployments**:
   - Keep the previous version of your code ready to deploy
   - Maintain database backups for data rollback

## Scaling Considerations

As your application grows:

1. **Database scaling**:
   - Consider read replicas for heavy read operations
   - Implement database connection pooling

2. **Application scaling**:
   - Add more instances behind a load balancer
   - Implement caching layers (Redis)

3. **Media storage**:
   - Move images to a dedicated storage service (AWS S3, Cloudinary)

## CI/CD Pipeline

For automated deployments, set up a CI/CD pipeline:

1. **GitHub Actions example**:
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Install dependencies
           run: npm ci
         - name: Run tests
           run: npm test
         - name: Deploy to production
           if: success()
           uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             vercel-args: '--prod'
   ``` 