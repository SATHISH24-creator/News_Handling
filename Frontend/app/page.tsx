'use client'

import { useState } from 'react'
import { Rss, Database, Brain, Sparkles } from 'lucide-react'
import RSSNewsFetcher from '@/components/RSSNewsFetcher'
import FilteredNewsViewer from '@/components/FilteredNewsViewer'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'rss' | 'filtered'>('rss')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              <Brain className="w-16 h-16 text-indigo-600 animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Neural News Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered news aggregation and filtering platform that transforms how you consume information
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-2 animate-slide-up">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('rss')}
                className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'rss'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Rss className="w-5 h-5 mr-3" />
                RSS News Fetcher
                {activeTab === 'rss' && (
                  <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('filtered')}
                className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'filtered'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Database className="w-5 h-5 mr-3" />
                Filtered News Viewer
                {activeTab === 'filtered' && (
                  <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="transition-all duration-500 ease-in-out">
            {activeTab === 'rss' ? (
              <RSSNewsFetcher />
            ) : (
              <FilteredNewsViewer />
            )}
          </div>
        </div>
      </div>
      <Toaster />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}