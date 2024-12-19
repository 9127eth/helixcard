import { useState, useEffect, useCallback } from 'react'
import { Tag } from '@/app/types'
import { useAuth } from '@/app/hooks/useAuth'
import { getTags, createTag, deleteTag, updateTag } from '@/app/lib/contacts'
import { Trash2, Plus, X, Edit2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface ManageTagsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageTagsModal({ isOpen, onClose }: ManageTagsModalProps) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadTags = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const userTags = await getTags(user.uid)
      setTags(userTags)
    } catch (error) {
      console.error('Error loading tags:', error)
      setError('Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user || !isOpen) return
    loadTags()
  }, [user, isOpen, loadTags])

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) return
    setIsLoading(true)
    setError('')

    try {
      const newTag = await createTag(user.uid, {
        name: newTagName.trim(),
        color: '#808080' // Default color
      })
      setTags(prev => [...prev, newTag as Tag])
      setNewTagName('')
    } catch (error) {
      console.error('Error creating tag:', error)
      setError('Failed to create tag')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) return

    setIsLoading(true)
    setError('')

    try {
      await deleteTag(user.uid, tagId)
      setTags(prev => prev.filter(tag => tag.id !== tagId))
    } catch (error) {
      console.error('Error deleting tag:', error)
      setError('Failed to delete tag')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTag = async (tagId: string) => {
    if (!user || !editingTagName.trim()) return
    setIsLoading(true)
    setError('')

    try {
      await updateTag(user.uid, tagId, { name: editingTagName.trim() })
      setTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, name: editingTagName.trim() } : tag
      ))
      setEditingTagId(null)
      setEditingTagName('')
    } catch (error) {
      console.error('Error updating tag:', error)
      setError('Failed to update tag')
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditingTagName(tag.name)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[425px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Tags</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Create new tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter new tag name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              onClick={handleCreateTag}
              disabled={isLoading || !newTagName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Tags list */}
          <div className="space-y-2">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded-md dark:border-gray-700"
                >
                  {editingTagId === tag.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditTag(tag.id)}
                        disabled={!editingTagName.trim()}
                        className="px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingTagId(null)
                          setEditingTagName('')
                        }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>{tag.name}</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditing(tag)}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 