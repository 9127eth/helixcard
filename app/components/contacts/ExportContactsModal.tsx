import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/app/hooks/useAuth'
import { Contact } from '@/app/types'

interface ExportContactsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedContacts: Contact[]
}

export default function ExportContactsModal({
  isOpen,
  onClose,
  selectedContacts
}: ExportContactsModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get the current user's ID token
      const token = await user?.getIdToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/contacts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactIds: selectedContacts.map(c => c.id),
          email: email
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      onClose()
    } catch (error) {
      console.error('Export error:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export Contacts</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleExport} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedContacts.length} contact(s) will be exported and sent to your email address.
          </p>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs mb-1 font-bold text-gray-400">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 