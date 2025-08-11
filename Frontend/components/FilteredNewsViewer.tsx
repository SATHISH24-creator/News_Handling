'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
  ExternalLink,
  Loader2,
  Search,
  Calendar,
  Filter,
  Smartphone,
  Monitor,
  RefreshCw,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Sparkles,
  FileText,
  TrendingUp,
  Tag
} from 'lucide-react'
import { apiClient, NewsEntry } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

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
  }, [])

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
      toast.success(`Found ${response.entries.length} filtered news entries`, {
        description: "Data refreshed successfully",
      })
    } catch (error) {
      console.error('Error fetching filtered news:', error)
      toast.error("Failed to fetch filtered news", {
        description: "An error occurred while loading the data",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'Rejected':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle2 className="w-4 h-4" />
      case 'Rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Big AI Moves': 'text-purple-600 bg-purple-50 border-purple-200',
      'Featured': 'text-orange-600 bg-orange-50 border-orange-200',
      'Technology': 'text-blue-600 bg-blue-50 border-blue-200',
      'Research': 'text-teal-600 bg-teal-50 border-teal-200',
      'Business': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Policy': 'text-indigo-600 bg-indigo-50 border-indigo-200',
    }
    return colors[category] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const acceptedCount = entries.filter(e => e.status === 'Accepted').length
  const rejectedCount = entries.filter(e => e.status === 'Rejected').length
  const pendingCount = entries.filter(e => e.status !== 'Accepted' && e.status !== 'Rejected').length

  return (
    <div className="space-y-8">
      {/* Main Control Panel */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                News Curator
              </CardTitle>
              <CardDescription className="text-base">
                Review and analyze your curated news collection with advanced filtering
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
          <div className={`grid ${mobileMode ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-6'}`}>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Status Filter</span>
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Accepted">Accepted Only</SelectItem>
                  <SelectItem value="Rejected">Rejected Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="Filter by keyword..."
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={fetchFilteredNews}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Refreshing Data...' : 'Refresh Filtered News'}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {entries.length > 0 && (
        <div className={`grid ${mobileMode ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-6'}`}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Accepted</p>
                  <p className="text-3xl font-bold text-green-700">{acceptedCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-700">{rejectedCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total</p>
                  <p className="text-3xl font-bold text-blue-700">{entries.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Section */}
      {entries.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Curated News Collection</span>
                </CardTitle>
                <CardDescription>
                  Displaying {entries.length} articles from your filtered selection
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">AI-Powered Curation</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="space-y-0">
              {mobileMode ? (
                // Mobile layout
                <div className="space-y-0">
                  {entries.map((entry) => (
                    <div key={entry._id} className="border-b last:border-b-0 p-6 hover:bg-gray-50 transition-all duration-200">
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
                          {entry.description || 'No description available'}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="outline" className="border-gray-300">
                            <Calendar className="w-3 h-3 mr-1" />
                            {entry.published_date}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300">
                            <Globe className="w-3 h-3 mr-1" />
                            {entry.source}
                          </Badge>
                          {entry.predicted_category && (
                            <Badge className={`${getCategoryColor(entry.predicted_category)} border`}>
                              <Tag className="w-3 h-3 mr-1" />
                              {entry.predicted_category}
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(entry.status)} border`}>
                            {getStatusIcon(entry.status)}
                            <span className="ml-1">{entry.status}</span>
                          </Badge>
                        </div>

                        <div className="pt-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                          >
                            <a
                              href={entry.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Read Article
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop layout
                <div>
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 p-6 border-b font-semibold text-gray-700 bg-gray-50">
                    <div className="col-span-3 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Title</span>
                    </div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-2 text-center">Published Date</div>
                    <div className="col-span-1 text-center">Source</div>
                    <div className="col-span-2 text-center">Category</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>
                  
                  {/* Entries */}
                  <div className="space-y-0">
                    {entries.map((entry) => (
                      <div key={entry._id} className="grid grid-cols-12 gap-4 items-center p-6 border-b last:border-b-0 hover:bg-gray-50 transition-all duration-200 group">
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
                        
                        <div className="col-span-3">
                          <div className="text-sm text-gray-600 leading-relaxed">
                            {entry.description || 'No description available'}
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className="border-gray-300">
                            <Calendar className="w-3 h-3 mr-1" />
                            {entry.published_date}
                          </Badge>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <Badge variant="outline" className="border-gray-300">
                            <Globe className="w-3 h-3 mr-1" />
                            {entry.source}
                          </Badge>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          {entry.predicted_category ? (
                            <Badge className={`${getCategoryColor(entry.predicted_category)} border text-xs`}>
                              <Tag className="w-3 h-3 mr-1" />
                              {entry.predicted_category}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">No category</span>
                          )}
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <Badge className={`${getStatusColor(entry.status)} border text-xs`}>
                            {getStatusIcon(entry.status)}
                            <span className="ml-1">{entry.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Filtered News Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No news entries match your current filter criteria. Try adjusting your filters or date range to see more results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}