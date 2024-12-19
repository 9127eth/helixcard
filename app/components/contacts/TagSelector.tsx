import { useState, useEffect, useCallback } from 'react'
import { Filter, ChevronDown, Check, X } from 'lucide-react'
import { Tag } from '@/app/types'
import { useAuth } from '@/app/hooks/useAuth'
import { getTags, createTag } from '@/app/lib/contacts'
import LoadingSpinner from '../LoadingSpinner'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  isFilter?: boolean
  allowCreate?: boolean
}

export default function TagSelector({ 
  selectedTags, 
  onChange,
  isFilter = false,
  allowCreate = true
}: TagSelectorProps) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [error, setError] = useState('')

  const loadTags = useCallback(async () => {
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
  }, [user])

  const toggleTag = (tagId: string) => {
    onChange(
      selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId]
    )
  }

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) return
    setIsLoading(true)
    setError('')

    try {
      const newTag = await createTag(user.uid, {
        name: newTagName.trim(),
        color: '#808080'
      })
      setTags(prev => [...prev, newTag as Tag])
      setNewTagName('')
      toggleTag(newTag.id)
    } catch (error) {
      console.error('Error creating tag:', error)
      setError('Failed to create tag')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [loadTags])

  // Get selected tag objects with names
  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id))

  return (
    <div className="space-y-2">
      {!isFilter && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
            >
              {tag.name}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTag(tag.id)
                }}
                className="ml-1.5 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedTagObjects.length === 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              None
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 min-w-[80px] h-12"
      >
        {isFilter && <Filter className="h-3.5 w-3.5" />}
        <span>
          {isFilter 
            ? selectedTags.length > 0 
              ? `${selectedTags.length} selected` 
              : 'Filter'
            : 'Add/Remove Tags'
          }
        </span>
        {!isFilter && (
          <ChevronDown 
            size={16}
            className={`transform transition-transform ${isFilterOpen ? 'rotate-180' : ''} flex-shrink-0`} 
          />
        )}
      </button>

      {/* Tag selector dropdown */}
      {isFilterOpen && (
        <div className="absolute z-50 w-[250px] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Tags</h3>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          
          {allowCreate && (
            <div className="mb-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag name"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isLoading}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner />
              </div>
            ) : (
              tags.map(tag => (
                <div
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    selectedTags.includes(tag.id)
                      ? 'bg-blue-50 dark:bg-blue-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                  {selectedTags.includes(tag.id) && (
                    <Check size={16} className="text-blue-500" />
                  )}
                </div>
              ))
            )}
            {!isLoading && tags.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No tags available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
