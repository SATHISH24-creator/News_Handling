import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface RSSEntry {
  title: string
  description: string
  link: string
  published_date: string
  source: string
  image: string
}

export interface FilterParams {
  start_date: string
  end_date: string
  keyword?: string
  status_filter?: string
  source_filter?: string
}

export interface NewsEntry {
  _id: string
  title: string
  description: string
  link: string
  published_date: string
  source: string
  status: string
  saved_at: string
}

// API functions
export const apiClient = {
  // RSS Sources
  getRSSSources: async () => {
    const response = await api.get('/api/rss-sources')
    return response.data
  },

  // Fetch RSS feeds
  fetchRSSFeeds: async (params: FilterParams) => {
    const response = await api.post('/api/fetch-rss', params)
    return response.data
  },

  // Extract description from URL
  extractDescription: async (url: string) => {
    const response = await api.post('/api/extract-description', { url })
    return response.data
  },

  // Save news status
  saveNewsStatus: async (entry: RSSEntry, status: string) => {
    const response = await api.post('/api/save-news-status', { entry, status })
    return response.data
  },

  // Get filtered news
  getFilteredNews: async (params: {
    status_filter?: string
    start_date?: string
    end_date?: string
    keyword_filter?: string
  }) => {
    const response = await api.get('/api/filtered-news', { params })
    return response.data
  },
}
