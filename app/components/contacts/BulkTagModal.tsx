import { useEffect, useState } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { batchUpdateContactTags } from '@/app/lib/contacts'
import TagSelector from './TagSelector'

interface BulkTagModalProps {
  isOpen: boolean
  onClose: () => void
  selectedContactIds: string[]
  onSuccess?: () => void
}

export default function BulkTagModal({
  isOpen,
  onClose,
  selectedContactIds,
  onSuccess
}: BulkTagModalProps) {
  const { user } = useAuth()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedTags([])
      setError('')
    }
  }, [isOpen])

  // Adds to or removes from each contact's existing tags; never replaces them.
  const handleSubmit = async (action: 'add' | 'remove') => {
    if (!user || selectedTags.length === 0) return
    
    setPendingAction(action)
    setError('')
    try {
      await batchUpdateContactTags(user.uid, selectedContactIds, selectedTags, action)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating tags:', error)
      setError(action === 'add' ? 'Failed to add tags' : 'Failed to remove tags')
    } finally {
      setPendingAction(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Manage Tags for {selectedContactIds.length} Contact{selectedContactIds.length !== 1 ? 's' : ''}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selected Tags
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('remove')}
              disabled={pendingAction !== null || selectedTags.length === 0}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              {pendingAction === 'remove' ? 'Removing...' : 'Remove Tags'}
            </button>
            <button
              onClick={() => handleSubmit('add')}
              disabled={pendingAction !== null || selectedTags.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              {pendingAction === 'add' ? 'Adding...' : 'Add Tags'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
