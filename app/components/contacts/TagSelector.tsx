import { useState, useEffect, useCallback, useRef } from 'react'
import { Filter, ChevronDown, Check, X, Tag as TagIcon, Plus } from 'lucide-react'
import { Tag } from '@/app/types'
import { useAuth } from '@/app/hooks/useAuth'
import { getTags, createTag } from '@/app/lib/contacts'
import LoadingSpinner from '../LoadingSpinner'
import { btnSecondary, inputClass } from '../ui/editor'

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
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    // Add event listener if dropdown is open
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterOpen])

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
    <div className="relative space-y-2" ref={dropdownRef}>
      {!isFilter && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTagObjects.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#7CCEDA]/15 py-1 pl-2.5 pr-1 text-xs font-medium text-[#2E7C89] dark:bg-[#7CCEDA]/10 dark:text-[#7CCEDA]"
            >
              {tag.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTag(tag.id)
                }}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-[#7CCEDA]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7CCEDA]"
                aria-label={`Remove tag ${tag.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedTagObjects.length === 0 && (
            <span className="py-1 text-xs text-gray-500 dark:text-gray-400">
              No tags yet
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        aria-expanded={isFilterOpen}
        className={
          isFilter
            ? `flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-full dark:border-gray-600 min-w-[80px] h-12 ${
                selectedTags.length > 0
                  ? 'bg-gray-300 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            : `${btnSecondary} px-3.5 py-2`
        }
      >
        {isFilter ? (
          <>
            <Filter className="h-3.5 w-3.5" />
            <span>{selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Filter'}</span>
          </>
        ) : (
          <>
            <TagIcon size={15} className="text-gray-500 dark:text-gray-400" />
            <span>Add or remove tags</span>
            <ChevronDown
              size={15}
              className={`shrink-0 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Tag selector dropdown */}
      {isFilterOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[270px] rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:border-white/10 dark:bg-[#2c2d31] dark:ring-white/5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Tags</h3>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close tag picker"
            >
              <X size={14} />
            </button>
          </div>

          {allowCreate && (
            <div className="mb-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag name"
                  aria-label="New tag name"
                  className={`${inputClass} px-3 py-2`}
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isLoading}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Add
                </button>
              </div>
              {error && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner fullScreen={false} />
              </div>
            ) : (
              tags.map(tag => {
                const selected = selectedTags.includes(tag.id)
                return (
                  <div
                    key={tag.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${
                      selected
                        ? 'bg-[#7CCEDA]/15 font-medium text-[#2E7C89] dark:bg-[#7CCEDA]/10 dark:text-[#7CCEDA]'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {tag.name}
                    </span>
                    {selected && (
                      <Check size={15} strokeWidth={2.5} />
                    )}
                  </div>
                )
              })
            )}
            {!isLoading && tags.length === 0 && (
              <p className="py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                No tags yet. Create one above.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
