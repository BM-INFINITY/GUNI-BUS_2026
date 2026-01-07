# GUNI-BUS Deployment Guide

## 🚀 Deploying to Production

This guide will help you deploy the GUNI-BUS application with:
- **Backend** → Render
- **Frontend** → Vercel

---

## Prerequisites

- [ ] GitHub account
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] MongoDB Atlas account (free tier available)
- [ ] Your code pushed to GitHub

---

## Part 1: Backend Deployment (Render)

### Step 1: Prepare Your MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't already)
3. Create database and get your connection string
4. **Important**: Whitelist all IP addresses (0.0.0.0/0) for Render access
   - In MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere

### Step 2: Deploy Backend to Render

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Create New Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   
3. **Configure the Service**
   - **Name**: `guni-bus-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A strong random secret (generate one!) |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://your-app.vercel.app` (add after Vercel deployment) |

   > **Tip**: For JWT_SECRET, use a strong random string. You can generate one at [RandomKeygen](https://randomkeygen.com/)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (~5-10 minutes)
   - Copy your Render URL (e.g., `https://guni-bus-backend.onrender.com`)

6. **Test Your Backend**
   - Visit: `https://your-render-url.onrender.com/api/health`
   - You should see: `{"status":"healthy","timestamp":"..."}`

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Deploy Frontend to Vercel

1. **Go to Vercel**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure the Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Add Environment Variables**
   Before deploying, add environment variable:
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-render-url.onrender.com/api` |
   
   > Replace `your-render-url` with your actual Render backend URL

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)
   - Copy your Vercel URL (e.g., `https://guni-bus.vercel.app`)

### Step 2: Update Backend with Frontend URL

1. **Go back to Render Dashboard**
2. Navigate to your backend service
3. Go to "Environment" tab
4. Update or add `CLIENT_URL` environment variable:
   - **Key**: `CLIENT_URL`
   - **Value**: `https://your-vercel-url.vercel.app` (your actual Vercel URL)
5. Click "Save Changes"
6. Your backend will automatically redeploy

---

## Part 3: Testing Your Deployment

### Frontend Tests
- [ ] Visit your Vercel URL
- [ ] Try logging in with test credentials
- [ ] Check if API calls work (Network tab in DevTools)
- [ ] Test all major features

### Backend Tests
- [ ] Check health endpoint: `https://your-render-url.onrender.com/api/health`
- [ ] Verify CORS is working (no CORS errors in browser console)
- [ ] Test API endpoints with Postman/Thunder Client

### Common Issues

**CORS Errors:**
- Make sure `CLIENT_URL` in Render matches your Vercel URL exactly
- No trailing slash in URLs

**API Connection Fails:**
- Verify `VITE_API_URL` in Vercel includes `/api` at the end
- Check Render logs for errors

**Database Connection Fails:**
- Verify MongoDB connection string is correct
- Check MongoDB Atlas network access allows all IPs (0.0.0.0/0)

**Build Fails:**
- Check Render/Vercel build logs
- Ensure all dependencies are in `package.json`, not just dev

---

## Part 4: Environment Variables Reference

### Backend (Render)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-random-string
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🎉 Success!

Your application should now be live:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com

---

## Maintenance Tips

### Free Tier Limitations
- **Render Free**: Spins down after 15 minutes of inactivity (first request may be slow)
- **Vercel Free**: Unlimited bandwidth for personal projects

### Updating Your App
- **Frontend**: Just push to GitHub, Vercel auto-deploys
- **Backend**: Just push to GitHub, Render auto-deploys

### Monitoring
- Check Render logs: Render Dashboard → Your Service → Logs
- Check Vercel logs: Vercel Dashboard → Your Project → Deployments → View Function Logs

---

## Need Help?

If you encounter issues:
1. Check Render deployment logs
2. Check Vercel deployment logs
3. Check browser console for errors
4. Verify all environment variables are set correctly
