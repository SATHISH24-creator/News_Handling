# 🧠 Neural News Hub - Vercel Migration

This project has been migrated from a Streamlit application to a Vercel-compatible architecture with FastAPI backend and Next.js frontend.

## 📋 Migration Overview

### Original Structure (Streamlit)
```
Frontend (Streamlit UI):
├── app.py              # Main Streamlit entry
├── RSS_app.py          # RSS fetch and description generation
└── DB_app.py           # MongoDB save/update operations

Backend logic:
├── rss_fetcher.py      # Parses RSS feeds
├── rss_sources.py      # Contains list of RSS sources
└── db_utils.py         # Saves and updates articles in MongoDB
```

### New Structure (Vercel-Compatible)
```
api/                    # FastAPI Backend
├── main.py            # Main FastAPI application
├── requirements.txt   # Python dependencies
├── vercel.json       # Vercel deployment config
└── env.example       # Environment variables template

frontend/              # Next.js Frontend
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # API client and utilities
├── package.json     # Node.js dependencies
└── tsconfig.json    # TypeScript configuration
```

## 🚀 Current Functions Migrated

### RSS News Fetcher (from RSS_app.py)
- ✅ **Date Range Filtering**: Filter articles by start/end dates
- ✅ **Keyword Search**: Search articles by keyword in title/description
- ✅ **Source Filtering**: Filter by specific RSS sources
- ✅ **Sorting**: Sort articles A-Z or Z-A by title
- ✅ **Description Extraction**: Extract descriptions using newspaper3k + OpenRouter LLM API
- ✅ **Accept/Reject Actions**: Save articles as Accepted/Rejected in MongoDB
- ✅ **Mobile/Desktop Layouts**: Responsive design with layout toggle

### Filtered News Viewer (from DB_app.py)
- ✅ **Status Filtering**: Filter by All/Accepted/Rejected status
- ✅ **Date Range Filtering**: Filter by saved date range
- ✅ **Keyword Search**: Search saved articles by keyword
- ✅ **MongoDB Integration**: View saved articles from database
- ✅ **Mobile/Desktop Layouts**: Responsive design with layout toggle

### Backend Functions (from Backend/)
- ✅ **RSS Fetching**: Parse RSS feeds with date normalization
- ✅ **Description Generation**: Extract descriptions using newspaper3k + LLM API
- ✅ **MongoDB Operations**: Save, update, and query articles
- ✅ **HTML Stripping**: Clean HTML from RSS content

## 🛠️ API Endpoints

### FastAPI Backend (`api/main.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/rss-sources` | GET | Get available RSS sources |
| `/api/fetch-rss` | POST | Fetch RSS feeds with filtering |
| `/api/extract-description` | POST | Extract description from article URL |
| `/api/save-news-status` | POST | Save/update news status in MongoDB |
| `/api/filtered-news` | GET | Get filtered news from MongoDB |

## 🚀 Deployment Instructions

### Backend Deployment (Vercel)

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   - Copy `env.example` to `.env`
   - Add your `OPENROUTER_API_KEY` and `MONGODB_URI`

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

### Frontend Deployment (Vercel)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `env.local.example` to `.env.local`
   - Set `NEXT_PUBLIC_API_BASE_URL` to your deployed API URL

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## 🔧 Environment Variables

### Backend (`.env`)
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.vercel.app
```

## 🎨 Features

### Responsive Design
- Mobile and desktop layouts
- Toggle between layout modes
- Tailwind CSS for modern styling

### Real-time Updates
- Automatic filtering and sorting
- Live description extraction
- Instant status updates

### Modern UI/UX
- Clean, modern interface
- Loading states and animations
- Error handling and user feedback

## 🔄 Migration Benefits

1. **Vercel Compatibility**: Full deployment support on Vercel
2. **Scalability**: Separate frontend and backend for better scaling
3. **Performance**: Next.js provides better performance than Streamlit
4. **Developer Experience**: TypeScript, modern tooling, and better debugging
5. **Mobile Support**: Better mobile experience with responsive design
6. **API-First**: RESTful API that can be used by other applications

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is properly configured in the FastAPI backend
2. **Environment Variables**: Make sure all required environment variables are set
3. **MongoDB Connection**: Verify your MongoDB URI is correct and accessible
4. **API Key**: Ensure your OpenRouter API key is valid

### Development

1. **Backend Development:**
   ```bash
   cd api
   uvicorn main:app --reload
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm run dev
   ```

## 📝 Notes

- All original functionality has been preserved
- The UI has been modernized with Tailwind CSS
- TypeScript provides better type safety
- The API is now RESTful and can be consumed by other applications
- Mobile responsiveness has been improved
- Error handling has been enhanced

## 🔗 Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
