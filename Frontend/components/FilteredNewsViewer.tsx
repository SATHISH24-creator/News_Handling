'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { ExternalLink, Loader2 } from 'lucide-react'
import { apiClient, NewsEntry } from '@/lib/api'

export default function FilteredNewsViewer() {
  const [entries, setEntries] = useState<NewsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMode, setMobileMode] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState('All')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [keywordFilter, setKeywordFilter] = useState('')

  useEffect(() => {
    fetchFilteredNews()
  }, [statusFilter, startDate, endDate, keywordFilter])

  const fetchFilteredNews = async () => {
    setLoading(true)
    try {
      const params = {
        status_filter: statusFilter === 'All' ? undefined : statusFilter,
        start_date: startDate,
        end_date: endDate,
        keyword_filter: keywordFilter || undefined,
      }
      const response = await apiClient.getFilteredNews(params)
      setEntries(response.entries)
    } catch (error) {
      console.error('Error fetching filtered news:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'text-green-600'
      case 'Rejected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return '🟢'
      case 'Rejected':
        return '🔴'
      default:
        return '⚪'
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">🗂️ Filtered News</h2>
        
        {/* Mobile Mode Toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={mobileMode}
              onChange={(e) => setMobileMode(e.target.checked)}
              className="rounded"
            />
            <span>Switch to Mobile Layout</span>
          </label>
        </div>

        {/* Filters */}
        <div className={`grid ${mobileMode ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-4'} mb-6`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="All">All</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Keyword
            </label>
            <input
              type="text"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="Enter keyword..."
              className="input-field"
            />
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchFilteredNews}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Results */}
      {entries.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">📋 Available News</h3>
          
          {mobileMode ? (
            // Mobile layout
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry._id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-primary-600 hover:text-primary-700"
                    >
                      {entry.title}
                    </a>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {entry.description || 'No description'}
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Published: {entry.published_date}</span>
                    <span>Source: {entry.source}</span>
                  </div>
                  
                  <div className={`text-sm font-medium ${getStatusColor(entry.status)}`}>
                    {getStatusIcon(entry.status)} {entry.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop layout
            <div>
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 py-3 border-b font-semibold text-gray-700">
                <div className="col-span-3">Title</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-center">Published Date</div>
                <div className="col-span-2 text-center">Source</div>
                <div className="col-span-1 text-center">Status</div>
              </div>
              
              {/* Entries */}
              <div className="space-y-0">
                {entries.map((entry) => (
                  <div key={entry._id} className="grid grid-cols-12 gap-4 py-3 border-b last:border-b-0">
                    <div className="col-span-3">
                      <a
                        href={entry.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {entry.title}
                      </a>
                    </div>
                    
                    <div className="col-span-4">
                      <div className="text-sm text-gray-600">
                        {entry.description || 'No description'}
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-center text-sm text-gray-500">
                      {entry.published_date}
                    </div>
                    
                    <div className="col-span-2 text-center text-sm text-gray-500">
                      {entry.source}
                    </div>
                    
                    <div className={`col-span-1 text-center text-sm font-medium ${getStatusColor(entry.status)}`}>
                      {getStatusIcon(entry.status)} {entry.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div className="card text-center py-8">
          <p className="text-gray-500">
            No entries found in the selected date/status/keyword range.
          </p>
        </div>
      )}
    </div>
  )
}
