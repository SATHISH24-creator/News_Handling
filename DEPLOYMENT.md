# 🚀 Vercel Deployment Guide

This guide will help you deploy your Neural News Hub application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **Environment Variables**: Prepare your API keys and database URI

## 🔧 Environment Setup

### Backend Environment Variables

Create a `.env` file in the `api/` directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.vercel.app
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend

1. **Navigate to API directory:**
   ```bash
   cd api
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - Go to your project dashboard
   - Navigate to Settings → Environment Variables
   - Add:
     - `OPENROUTER_API_KEY`
     - `MONGODB_URI`

5. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Step 2: Deploy Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Update API URL:**
   - Replace `your-backend-domain.vercel.app` in `.env.local` with your actual backend URL

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - Add `NEXT_PUBLIC_API_BASE_URL` with your backend URL

## 🔍 Verification

### Backend Health Check
Visit: `https://your-backend-domain.vercel.app/`
Should return: `{"message": "Neural News Hub API"}`

### API Endpoints Test
Test these endpoints:
- `GET /api/rss-sources`
- `POST /api/fetch-rss`
- `POST /api/extract-description`
- `POST /api/save-news-status`
- `GET /api/filtered-news`

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is properly configured in the backend
   - Check that frontend URL is allowed in CORS settings

2. **Environment Variables Not Working**
   - Verify variables are set in Vercel dashboard
   - Redeploy after setting environment variables

3. **MongoDB Connection Issues**
   - Verify MongoDB URI is correct
   - Ensure MongoDB Atlas IP whitelist includes Vercel IPs

4. **API Key Issues**
   - Verify OpenRouter API key is valid
   - Check API key permissions

### Debug Commands

```bash
# Check backend logs
vercel logs your-backend-project

# Check frontend logs
vercel logs your-frontend-project

# Redeploy with debug info
vercel --prod --debug
```

## 📝 Notes

- Backend and frontend are deployed as separate projects
- Environment variables must be set in Vercel dashboard
- CORS is configured to allow all origins (configure properly for production)
- MongoDB connection uses connection pooling for better performance

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
