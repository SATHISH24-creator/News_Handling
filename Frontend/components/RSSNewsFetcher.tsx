'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Search,
  Calendar,
  SortAsc,
  SortDesc,
  Filter,
  Smartphone,
  Monitor,
  Download,
  Newspaper,
  Globe
} from 'lucide-react'
import { apiClient, RSSEntry, FilterParams } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

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
      toast.error("Failed to load RSS sources", {
        description: "An unexpected error occurred.",
      })
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
      toast.success(`Fetched ${response.entries.length} news entries`, {
        description: "Success",
      })

    } catch (error) {
      console.error('Error fetching news:', error)
      toast.error("Failed to fetch news entries", {
        description: "An error occurred",
      })

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
      toast.success("Description Extracted", {
        description: "Article description has been extracted successfully",
      })

      return description
    } catch (error) {
      console.error('Error extracting description:', error)
      toast.error("Failed to extract description", {
        description: "An error occurred",
      })

      return entry.description
    } finally {
      setExtractingDescriptions(prev => ({ ...prev, [url]: false }))
    }
  }

  const handleAccept = async (entry: RSSEntry) => {
    try {
      await apiClient.saveNewsStatus(entry, 'Accepted')
      toast.success("Article Accepted", {
        description: "News article has been marked as accepted",
      })

    } catch (error) {
      console.error('Error saving status:', error)
      toast.error("Failed to save article status", {
        description: "An error occurred",
      })

    }
  }

  const handleReject = async (entry: RSSEntry) => {
    try {
      await apiClient.saveNewsStatus(entry, 'Rejected')
      toast.success("Article Rejected", {
        description: "News article has been marked as rejected",
      })

    } catch (error) {
      console.error('Error saving status:', error)
      toast.error("Failed to save article status", {
        description: "An error occurred",
      })

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
    <div className="space-y-8">
      {/* Main Control Panel */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                News Arena
              </CardTitle>
              <CardDescription className="text-base">
                Discover and curate the latest news from multiple RSS sources
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Layout Toggle */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center space-x-3">
              <Monitor className="w-5 h-5 text-indigo-600" />
              <Label htmlFor="layout-mode" className="text-sm font-medium text-indigo-900">
                Display Mode
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Desktop</span>
              <Switch
                id="layout-mode"
                checked={mobileMode}
                onCheckedChange={setMobileMode}
                className="data-[state=checked]:bg-indigo-600"
              />
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Mobile</span>
            </div>
          </div>

          {/* Filters */}
          <div className={`grid ${mobileMode ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'}`}>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Start Date</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>End Date</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Search Keyword</span>
              </Label>
              <Input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter keyword to search..."
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Fetch Button */}
          <Button
            onClick={fetchNews}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Fetching News...' : 'Fetch Latest News'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {filteredAndSortedEntries.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Available News Entries
                </CardTitle>
                <CardDescription>
                  Found {filteredAndSortedEntries.length} articles matching your criteria
                </CardDescription>
              </div>

              <div className={`flex ${mobileMode ? 'flex-col w-full space-y-2' : 'space-x-3'}`}>
                <Select value={sortByTitle} onValueChange={(value: 'A - Z' | 'Z - A') => setSortByTitle(value)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <div className="flex items-center space-x-2">
                      {sortByTitle === 'A - Z' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A - Z">A - Z</SelectItem>
                    <SelectItem value="Z - A">Z - A</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Sources">All Sources</SelectItem>
                    {sourceNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="space-y-0">
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
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No News Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No news entries found for the current filters. Try adjusting your search criteria or date range.
            </p>
          </CardContent>
        </Card>
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
      <div className="border-b last:border-b-0 p-6 hover:bg-gray-50 transition-all duration-200">
        <div className="space-y-4">
          <div>
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:underline"
            >
              {entry.title}
            </a>
          </div>

          <div className="text-sm text-gray-600 leading-relaxed">
            {displayDescription || 'No description available'}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <Badge variant="outline" className="border-gray-300">
              <Calendar className="w-3 h-3 mr-1" />
              {entry.published_date}
            </Badge>
            <Badge variant="outline" className="border-gray-300">
              <Globe className="w-3 h-3 mr-1" />
              {entry.source}
            </Badge>
          </div>

          <Separator />

          <div className="flex space-x-3">
            <Button
              onClick={onAccept}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-all duration-200 transform hover:scale-105"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={onReject}
              variant="outline"
              size="sm"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 transform hover:scale-105"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 items-center p-6 border-b last:border-b-0 hover:bg-gray-50 transition-all duration-200 group">
      <div className="col-span-3">
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200 hover:underline group-hover:text-indigo-700"
        >
          {entry.title}
        </a>
      </div>

      <div className="col-span-4">
        <div className="text-sm text-gray-600 leading-relaxed text-justify">
          {displayDescription || 'No description available'}
        </div>
      </div>

      <div className="col-span-2 text-center">
        <Badge variant="outline" className="border-gray-300">
          <Calendar className="w-3 h-3 mr-1" />
          {entry.published_date}
        </Badge>
      </div>

      <div className="col-span-2 text-center">
        <Badge variant="outline" className="border-gray-300">
          <Globe className="w-3 h-3 mr-1" />
          {entry.source}
        </Badge>
      </div>

      <div className="col-span-1 flex justify-center space-x-2">
        <Button
          onClick={onAccept}
          size="sm"
          variant="ghost"
          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 transform hover:scale-110"
          title="Accept"
        >
          <CheckCircle className="w-5 h-5" />
        </Button>
        <Button
          onClick={onReject}
          size="sm"
          variant="ghost"
          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 transform hover:scale-110"
          title="Reject"
        >
          <XCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}