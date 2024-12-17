import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import { Tag } from '@/app/types'
import { useAuth } from '@/app/hooks/useAuth'
import { getTags } from '@/app/lib/contacts'
import LoadingSpinner from '../LoadingSpinner'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadTags = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const userTags = await getTags(user.uid)
      setTags(userTags)
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    onChange(
      selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId]
    )
  }

  useEffect(() => {
    if (isFilterOpen) {
      loadTags()
    }
  }, [isFilterOpen, user])

  if (!isFilterOpen) {
    return (
      <button
        onClick={() => setIsFilterOpen(true)}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 min-w-[80px]"
      >
        <Filter className="h-3.5 w-3.5" />
        <span>Filter {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <div className="absolute z-50 top-0 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[200px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Filter by Tags</h3>
          <button
            onClick={() => setIsFilterOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => {}}
                    className="h-4 w-4"
                  />
                  <span className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
