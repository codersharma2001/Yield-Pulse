# Deployment Guide - Vercel

This guide will walk you through deploying your Yield Dashboard to Vercel step by step.

## Prerequisites

1. A [GitHub](https://github.com) account
2. A [Vercel](https://vercel.com) account (free tier is fine)
3. Git installed on your computer
4. Your code pushed to a GitHub repository

## Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

If you haven't already pushed your code to GitHub:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare for Vercel deployment"

# Create a new repository on GitHub (via the website)
# Then add the remote and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 3: Import Your Project

1. On your Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your repository in the list and click **"Import"**
3. Vercel will auto-detect it as a monorepo with Turborepo

### Step 4: Configure Build Settings

Vercel should auto-detect your settings from `vercel.json`, but verify:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web` (or leave blank if vercel.json is working)
- **Build Command**: `pnpm turbo run build --filter=web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

### Step 5: Set Environment Variables

Click on **"Environment Variables"** and add these (if you have them):

**Required:**
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

**Optional (for Tenderly simulation):**
- `NEXT_PUBLIC_TENDERLY_API_KEY` = Your Tenderly API key
- `NEXT_PUBLIC_TENDERLY_PROJECT` = Your Tenderly project name
- `NEXT_PUBLIC_TENDERLY_ACCOUNT` = Your Tenderly account name

**Leave these empty (will use defaults):**
- `NEXT_PUBLIC_API_BASE_URL` = Leave empty (uses Next.js API routes)

### Step 6: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your deployment URL (e.g., `your-project.vercel.app`)

### Step 7: Test Your Deployment

1. Click on the deployment URL
2. Verify the app loads correctly
3. Test the vault explorer
4. Try connecting your wallet
5. Test a simulation (if Tenderly is configured)

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your custom domain
4. Follow the DNS configuration instructions

### Environment Variables for Production

After deployment, you can update environment variables:

1. Go to your project in Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. Add or edit variables
4. Choose which environment (Production, Preview, Development)
5. Click **"Save"**
6. Redeploy for changes to take effect

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches and pull requests

## Troubleshooting

### Build Fails with "Module not found"

**Solution**: Make sure all dependencies are in `package.json` files:
```bash
# Run locally to verify
pnpm install
pnpm turbo run build
```

### API Routes Return 404

**Solution**: Check that:
1. API routes are in `apps/web/app/api/` directory
2. Files are named `route.ts` (not `index.ts`)
3. `vercel.json` has correct `outputDirectory`

### Environment Variables Not Working

**Solution**:
1. Make sure variable names start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding variables
3. Check they're set for the right environment (Production/Preview)

### Build Times Out

**Solution**:
1. Check for infinite loops in API routes
2. Reduce build complexity
3. Upgrade to Vercel Pro for longer build times

## Monitoring Your Deployment

### View Logs

1. Go to your project in Vercel
2. Click on a deployment
3. Click **"Runtime Logs"** to see API logs
4. Click **"Build Logs"** to see build output

### Analytics

Vercel provides free analytics:
1. Go to **"Analytics"** tab in your project
2. View page views, performance metrics

## Next Steps

- [ ] Get a WalletConnect Project ID and add to environment variables
- [ ] (Optional) Get Tenderly API key for production simulations
- [ ] (Optional) Add custom domain
- [ ] (Optional) Set up [Vercel Analytics](https://vercel.com/analytics)
- [ ] (Optional) Configure [Vercel Speed Insights](https://vercel.com/docs/concepts/speed-insights)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Discord](https://vercel.com/discord)
