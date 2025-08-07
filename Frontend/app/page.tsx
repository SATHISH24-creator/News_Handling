'use client'

import { useState } from 'react'
import { Rss, Database } from 'lucide-react'
import RSSNewsFetcher from '@/components/RSSNewsFetcher'
import FilteredNewsViewer from '@/components/FilteredNewsViewer'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'rss' | 'filtered'>('rss')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🧠 Neural News Hub
        </h1>
        <p className="text-gray-600">
          AI-powered news aggregation and filtering platform
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white rounded-lg shadow-md p-1">
          <button
            onClick={() => setActiveTab('rss')}
            className={`flex items-center px-6 py-3 rounded-md transition-colors duration-200 ${
              activeTab === 'rss'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Rss className="w-5 h-5 mr-2" />
            📰 RSS News Fetcher
          </button>
          <button
            onClick={() => setActiveTab('filtered')}
            className={`flex items-center px-6 py-3 rounded-md transition-colors duration-200 ${
              activeTab === 'filtered'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-5 h-5 mr-2" />
            🗂️ Filtered News Viewer
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'rss' ? (
          <RSSNewsFetcher />
        ) : (
          <FilteredNewsViewer />
        )}
      </div>
    </div>
  )
}
