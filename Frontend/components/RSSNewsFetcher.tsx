'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { apiClient, RSSEntry, FilterParams } from '@/lib/api'

export default function RSSNewsFetcher() {
  const [entries, setEntries] = useState<RSSEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMode, setMobileMode] = useState(false)
  const [sortByTitle, setSortByTitle] = useState<'A - Z' | 'Z - A'>('A - Z')
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [sources, setSources] = useState<Record<string, [string, string]>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [extractingDescriptions, setExtractingDescriptions] = useState<Record<string, boolean>>({})

  // Filter states
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    try {
      const response = await apiClient.getRSSSources()
      setSources(response.sources)
    } catch (error) {
      console.error('Error loading sources:', error)
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    try {
      const params: FilterParams = {
        start_date: startDate,
        end_date: endDate,
        keyword: keyword || undefined,
      }
      const response = await apiClient.fetchRSSFeeds(params)
      setEntries(response.entries)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractDescription = async (url: string, entry: RSSEntry) => {
    if (descriptions[url]) return descriptions[url]

    setExtractingDescriptions(prev => ({ ...prev, [url]: true }))
    try {
      const response = await apiClient.extractDescription(url)
      const description = response.description
      setDescriptions(prev => ({ ...prev, [url]: description }))
      return description
    } catch (error) {
      console.error('Error extracting description:', error)
      return entry.description
    } finally {
      setExtractingDescriptions(prev => ({ ...prev, [url]: false }))
    }
  }

  const handleAccept = async (entry: RSSEntry) => {
    try {
      await apiClient.saveNewsStatus(entry, 'Accepted')
      // You could add a toast notification here
    } catch (error) {
      console.error('Error saving status:', error)
    }
  }

  const handleReject = async (entry: RSSEntry) => {
    try {
      await apiClient.saveNewsStatus(entry, 'Rejected')
      // You could add a toast notification here
    } catch (error) {
      console.error('Error saving status:', error)
    }
  }

  const filteredAndSortedEntries = entries
    .filter(entry => sourceFilter === 'All Sources' || entry.source === sourceFilter)
    .sort((a, b) => {
      const comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      return sortByTitle === 'Z - A' ? -comparison : comparison
    })

  const sourceNames = Object.values(sources).map(([name]) => name)

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">📰 News Arena</h2>
        
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
        <div className={`grid ${mobileMode ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'} mb-6`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
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
              End Date
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
              Search Keyword (Optional)
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword..."
              className="input-field"
            />
          </div>
        </div>

        {/* Fetch Button */}
        <button
          onClick={fetchNews}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          <span>{loading ? 'Fetching...' : 'Fetch News'}</span>
        </button>
      </div>

      {/* Results */}
      {filteredAndSortedEntries.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Available News Entries</h3>
            
            <div className={`flex ${mobileMode ? 'flex-col space-y-2' : 'space-x-4'}`}>
              <select
                value={sortByTitle}
                onChange={(e) => setSortByTitle(e.target.value as 'A - Z' | 'Z - A')}
                className="input-field max-w-xs"
              >
                <option value="A - Z">A - Z</option>
                <option value="Z - A">Z - A</option>
              </select>
              
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="All Sources">All Sources</option>
                {sourceNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* News Entries */}
          <div className="space-y-4">
            {filteredAndSortedEntries.map((entry, index) => (
              <NewsEntryCard
                key={`${entry.title}-${index}`}
                entry={entry}
                mobileMode={mobileMode}
                onExtractDescription={() => extractDescription(entry.link, entry)}
                onAccept={() => handleAccept(entry)}
                onReject={() => handleReject(entry)}
                description={descriptions[entry.link]}
                extractingDescription={extractingDescriptions[entry.link]}
              />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div className="card text-center py-8">
          <p className="text-gray-500">No news entries found for the current filters.</p>
        </div>
      )}
    </div>
  )
}

interface NewsEntryCardProps {
  entry: RSSEntry
  mobileMode: boolean
  onExtractDescription: () => void
  onAccept: () => void
  onReject: () => void
  description?: string
  extractingDescription?: boolean
}

function NewsEntryCard({
  entry,
  mobileMode,
  onExtractDescription,
  onAccept,
  onReject,
  description,
  extractingDescription
}: NewsEntryCardProps) {
  const displayDescription = description || entry.description

  if (mobileMode) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
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
          {displayDescription}
          {!description && (
            <button
              onClick={onExtractDescription}
              disabled={extractingDescription}
              className="ml-2 text-primary-600 hover:text-primary-700 text-xs"
            >
              {extractingDescription ? 'Extracting...' : 'Extract Description'}
            </button>
          )}
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>Published: {entry.published_date}</span>
          <span>Source: {entry.source}</span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onAccept}
            className="btn-primary flex items-center space-x-1 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Accept</span>
          </button>
          <button
            onClick={onReject}
            className="btn-secondary flex items-center space-x-1 text-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0">
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
          {displayDescription}
          {!description && (
            <button
              onClick={onExtractDescription}
              disabled={extractingDescription}
              className="ml-2 text-primary-600 hover:text-primary-700 text-xs"
            >
              {extractingDescription ? 'Extracting...' : 'Extract'}
            </button>
          )}
        </div>
      </div>
      
      <div className="col-span-2 text-center text-sm text-gray-500">
        {entry.published_date}
      </div>
      
      <div className="col-span-2 text-center text-sm text-gray-500">
        {entry.source}
      </div>
      
      <div className="col-span-1 flex justify-center space-x-1">
        <button
          onClick={onAccept}
          className="p-1 text-green-600 hover:text-green-700"
          title="Accept"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
        <button
          onClick={onReject}
          className="p-1 text-red-600 hover:text-red-700"
          title="Reject"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
