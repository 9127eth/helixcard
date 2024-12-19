'use client'

import { useState, useEffect } from 'react'
import { Contact } from '@/app/types'
import { getContacts, deleteContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import LoadingSpinner from '../LoadingSpinner'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import DropdownMenu from '../DropdownMenu'

interface ContactListProps {
  searchQuery: string
  tagFilter: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkAddTag: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onView: (contact: Contact) => void
  onEdit: (contact: Contact) => void
}

export default function ContactList({ 
  searchQuery, 
  tagFilter, 
  onSelectionChange,
  onBulkAddTag,
  onBulkExport,
  onBulkDelete,
  onView,
  onEdit
}: ContactListProps) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  useEffect(() => {
    const loadContacts = async () => {
      if (!user) return
      
      try {
        const userContacts = await getContacts(user.uid)
        setContacts(userContacts)
      } catch (error) {
        console.error('Error loading contacts:', error)
        // TODO: Show error toast
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
  }, [user])

  const toggleSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSelection = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
      onSelectionChange(newSelection)
      return newSelection
    })
  }

  const toggleSelectAll = () => {
    const newSelection = selectedContacts.length === filteredContacts.length
      ? []
      : filteredContacts.map(c => c.id)
    setSelectedContacts(newSelection)
    onSelectionChange(newSelection)
  }

  // Filter contacts based on search query and tags
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = tagFilter.length === 0 || 
      tagFilter.every(tag => contact.tags.includes(tag))

    return matchesSearch && matchesTags
  })

  const handleView = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      onView(contact)
    }
  }

  const handleEdit = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      onEdit(contact)
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this contact? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      await deleteContact(user.uid, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (error) {
      console.error('Error deleting contact:', error);
      // TODO: Show error toast
    }
  };

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 pb-24">
      {filteredContacts.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md transition-colors ${
                isSelectionMode 
                  ? 'bg-gray-200 dark:bg-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              Select
            </button>
            {isSelectionMode && (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {selectedContacts.length === filteredContacts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {selectedContacts.length} selected
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    Bulk Actions:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={onBulkAddTag}
                      disabled={selectedContacts.length === 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Tag
                    </button>
                    <button
                      onClick={onBulkExport}
                      disabled={selectedContacts.length === 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Export
                    </button>
                    <button
                      onClick={onBulkDelete}
                      disabled={selectedContacts.length === 0}
                      className="text-sm px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {filteredContacts.map((contact) => (
        <div 
          key={contact.id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-[72px] flex items-center"
        >
          {isSelectionMode && (
            <div 
              className="pr-4 pl-2 -my-4 py-4 cursor-pointer flex items-center h-full"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(contact.id);
              }}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => toggleSelection(contact.id)}
                  className="h-4 w-4 rounded border-gray-300"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div 
            className="flex items-center gap-4 flex-1 cursor-pointer"
            onClick={() => handleView(contact.id)}
          >
            <div className="min-w-0">
              <h3 className="font-medium truncate">{contact.name}</h3>
              {contact.company && (
                <p className="text-sm text-gray-500 truncate">{contact.company}</p>
              )}
            </div>
          </div>
          
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              options={[
                { label: 'View', onClick: () => handleView(contact.id), icon: Eye },
                { label: 'Edit', onClick: () => handleEdit(contact.id), icon: Edit },
                { label: 'Delete', onClick: () => handleDelete(contact.id), icon: Trash2, danger: true },
              ]}
            />
          </div>
        </div>
      ))}
    </div>
  )
} 