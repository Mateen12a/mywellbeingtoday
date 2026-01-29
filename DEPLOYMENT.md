# Deployment Instructions

This guide explains how to deploy MyWellbeingToday with separate frontend and backend services.

## Architecture Overview

- **Frontend**: Static site deployed on Vercel or Render Static
- **Backend**: Node.js/Express API deployed on Render Web Services
- **Database**: MongoDB Atlas (already configured)

## Backend Deployment (Render Web Services)

### 1. Prepare the Backend

The backend is located in the `server/` directory and uses Express.js with MongoDB.

### 2. Create a Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `mywellbeingtoday-api` |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` |
   | **Root Directory** | Leave empty (uses project root) |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run start` |

### 3. Set Backend Environment Variables

Add these environment variables in Render:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | Random 64-character string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random 64-character string |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `GOOGLE_AI_API_KEY` | Google Gemini AI key | `AIza...` |
| `ALLOWED_ORIGINS` | Frontend URL(s) for CORS | `https://your-frontend.vercel.app` |

**Important**: Set `ALLOWED_ORIGINS` to your frontend URL. For multiple origins, separate with commas:
```
https://mywellbeingtoday.vercel.app,https://mywellbeingtoday.com
```

### 4. Deploy

Click "Create Web Service" and wait for deployment. Note your backend URL (e.g., `https://mywellbeingtoday-api.onrender.com`).

---

## Frontend Deployment (Vercel)

### 1. Prepare the Frontend

The frontend is a Vite React application in the `client/` directory.

### 2. Create a Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `client` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `npm install` |

### 3. Set Frontend Environment Variables

Add this environment variable in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://mywellbeingtoday-api.onrender.com` |

**Note**: Do NOT include `/api` at the end - just the base URL.

### 4. Deploy

Click "Deploy" and wait for the build to complete.

---

## Frontend Deployment (Render Static Site)

### Alternative: Deploy Frontend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Static Site"
3. Connect your repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `mywellbeingtoday-frontend` |
   | **Branch** | `main` |
   | **Root Directory** | `client` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

5. Add environment variable:
   - `VITE_API_URL` = `https://mywellbeingtoday-api.onrender.com`

---

## Health Check

The frontend automatically pings the backend every 5 minutes to keep it alive. This helps prevent cold starts on Render's free tier.

The health check endpoint is: `GET /api/health`

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "uptime": 3600
}
```

---

## Post-Deployment Checklist

1. **Update ALLOWED_ORIGINS**: Make sure your backend's `ALLOWED_ORIGINS` includes your frontend URL
2. **Test the connection**: Visit your frontend and check browser console for health check logs
3. **Verify authentication**: Test login/register flows
4. **Check API calls**: Ensure all API endpoints are working

---

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Verify `ALLOWED_ORIGINS` on the backend includes your frontend URL exactly
- Make sure there are no trailing slashes

### API Connection Failed
If the frontend can't reach the backend:
- Verify `VITE_API_URL` is set correctly (no `/api` suffix)
- Check the backend is running (visit `/api/health` directly)
- Ensure the backend URL uses HTTPS

### Cold Start Delays
Render's free tier has cold starts. The frontend's health check helps, but first requests may be slow. Consider:
- Upgrading to a paid Render plan
- Using a service like UptimeRobot to ping the health endpoint

---

## Environment Variables Summary

### Backend (Render Web Service)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-64-char-jwt-secret
JWT_REFRESH_SECRET=your-64-char-refresh-secret
RESEND_API_KEY=re_your_resend_key
GOOGLE_AI_API_KEY=AIzaSy...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (Vercel/Render Static)

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Render
1. Go to Service Settings → Custom Domains
2. Add your domain
3. Configure DNS (CNAME or A record)

**Remember** to update `ALLOWED_ORIGINS` on the backend when adding custom domains!
