import { useState } from 'react'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || selectedTags.length === 0) return
    
    setIsSubmitting(true)
    try {
      await batchUpdateContactTags(user.uid, selectedContactIds, selectedTags)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating tags:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
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

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedTags.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Tags'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 