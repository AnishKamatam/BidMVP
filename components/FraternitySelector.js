// components/FraternitySelector.js
// Reusable component for searching and selecting fraternities
// Props:
//   - schoolId: School ID to filter fraternities
//   - onSelect: Function(fraternityId) called when user selects
//   - onCreate: Function() called when user wants to create new
//   - loading: Boolean for loading state
//   - error: Error message string
//   - onSearch: Function(query) for searching fraternities

'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FraternityCard from '@/components/FraternityCard'

export default function FraternitySelector({ 
  schoolId,
  onSelect, 
  onCreate,
  loading = false, 
  error = null,
  onSearch 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedFraternity, setSelectedFraternity] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const searchInputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Auto-focus search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!searchQuery.trim() || !onSearch || !schoolId) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await onSearch(searchQuery.trim(), schoolId, 20)
        if (result.error) {
          setSearchError(result.error.message || 'Failed to search fraternities')
          setSearchResults([])
        } else {
          setSearchResults(result.data || [])
        }
      } catch (err) {
        setSearchError(err.message || 'Failed to search fraternities')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, schoolId, onSearch])

  const handleFraternityClick = (fraternity) => {
    setSelectedFraternity(fraternity)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleConfirmSelection = () => {
    if (selectedFraternity && onSelect && !loading) {
      onSelect(selectedFraternity.id)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedFraternity(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-5 h-5 text-gray-medium"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a fraternity..."
          className="pl-12 pr-10"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-medium hover:text-gray-dark"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Selected Fraternity Display */}
      {selectedFraternity && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-bodySmall font-semibold text-gray-dark">Selected Fraternity</h3>
            <button
              onClick={() => {
                setSelectedFraternity(null)
                setSearchQuery('')
                if (searchInputRef.current) {
                  searchInputRef.current.focus()
                }
              }}
              className="text-bodySmall text-primary-ui hover:text-primary-accent transition-colors"
            >
              Change Selection
            </button>
          </div>
          <FraternityCard 
            fraternity={selectedFraternity} 
            variant="compact"
            showMemberCount={true}
          />
          <Button
            onClick={handleConfirmSelection}
            disabled={loading}
            variant="primary"
            size="large"
            className="w-full"
          >
            {loading ? 'Joining...' : 'Join This Fraternity'}
          </Button>
        </div>
      )}

      {/* Search Results */}
      {!selectedFraternity && searchQuery.trim() && (
        <div className="relative">
          {searchLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-ui border-t-transparent"></div>
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((fraternity) => (
                <FraternityCard
                  key={fraternity.id}
                  fraternity={fraternity}
                  onClick={() => handleFraternityClick(fraternity)}
                  variant="compact"
                  showMemberCount={true}
                />
              ))}
            </div>
          )}

          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
            <div className="text-center py-8 text-gray-medium">
              <p className="text-bodySmall">No fraternities found</p>
              <p className="text-caption mt-1">Try a different search term</p>
            </div>
          )}

          {searchError && (
            <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-sm">
              {searchError}
            </div>
          )}
        </div>
      )}

      {/* Create New Button */}
      {!selectedFraternity && (
        <div className="pt-4 border-t border-gray-border">
          <Button
            onClick={onCreate}
            disabled={loading}
            variant="secondary"
            size="large"
            className="w-full"
          >
            Create New Fraternity
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-error text-error rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

