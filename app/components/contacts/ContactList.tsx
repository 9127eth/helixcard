'use client'

import { useState, useEffect, useCallback } from 'react'
import { Contact } from '@/app/types'
import { getContacts, deleteContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import LoadingSpinner from '../LoadingSpinner'
import { Eye, Edit, Trash2 } from 'lucide-react'
import DropdownMenu from '../DropdownMenu'
import ViewContactModal from './ViewContactModal'

interface ContactListProps {
  searchQuery: string
  tagFilter: string[]
  isSelectionMode: boolean
  sortOption: 'firstName' | 'dateAdded'
  onSelectionChange: (selectedIds: string[]) => void
  onContactsChange: (contacts: Contact[]) => void
  onBulkAddTag: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onView: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  refreshTrigger?: number
  initialContacts: Contact[]
}

export default function ContactList({ 
  searchQuery, 
  tagFilter, 
  sortOption,
  isSelectionMode,
  onSelectionChange,
  onContactsChange,
  onBulkAddTag,
  onBulkExport,
  onBulkDelete,
  onView,
  onEdit,
  refreshTrigger = 0,
  initialContacts = []
}: ContactListProps) {
  const { user } = useAuth()
  console.log('ContactList: Current user state:', user ? 'User authenticated' : 'No user');
  console.log('ContactList: User ID:', user ? '[redacted]' : 'null');
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedContact] = useState<Contact | null>(null)

  useEffect(() => {
    console.log('ContactList: initialContacts updated with', initialContacts.length, 'contacts');
    setContacts(initialContacts);
    onContactsChange(initialContacts);
  }, [initialContacts, onContactsChange]);

  const loadContacts = useCallback(async () => {
    if (initialContacts.length > 0) {
      console.log('ContactList: Using initialContacts, skipping load');
      return;
    }

    console.log('loadContacts: Starting to load contacts, user:', user ? 'exists' : 'null');
    if (!user) {
      console.log('loadContacts: No user, skipping contacts load');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('loadContacts: Fetching contacts for user ID: [redacted]');
      setIsLoading(true);
      const userContacts = await getContacts(user.uid)
      console.log('loadContacts: Received contacts:', userContacts.length, 'contacts');
      setContacts(userContacts)
      onContactsChange(userContacts)
    } catch (error) {
      console.error('Error loading contacts:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }, [user, onContactsChange, initialContacts])

  useEffect(() => {
    if (initialContacts.length === 0) {
      loadContacts();
    }
  }, [refreshTrigger, loadContacts, initialContacts.length]);

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

  // Add sorting logic
  const sortContacts = (contacts: Contact[]) => {
    return [...contacts].sort((a, b) => {
      if (sortOption === 'firstName') {
        return a.name.localeCompare(b.name);
      } else { // dateAdded
        // Convert string dates to timestamps for comparison
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateB - dateA;
      }
    });
  };

  // Filter contacts based on search query and tags
  const filteredContacts = sortContacts(contacts.filter(contact => {
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = tagFilter.length === 0 || 
      tagFilter.every(tag => contact.tags.includes(tag))

    return matchesSearch && matchesTags
  }))

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
      // Update local state
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      setContacts(updatedContacts);
      // Notify parent component about the change
      onContactsChange(updatedContacts);
    } catch (error) {
      console.error('Error deleting contact:', error);
      // TODO: Show error toast
    }
  };

  const handleExport = (contactId: string) => {
    setSelectedContacts([contactId]);
    onBulkExport();
  };

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 pb-24">
      {filteredContacts.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            {isSelectionMode && (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm hover:text-gray-900"
                >
                  {selectedContacts.length === filteredContacts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {selectedContacts.length} selected
                  </span>
                  <span className="text-sm font-medium">
                    Bulk Actions:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={onBulkAddTag}
                      disabled={selectedContacts.length === 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add/Remove Tags
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
          className="w-full relative mb-4"
        >
          <div 
            className="absolute top-1 left-1 w-full h-full rounded-xl" 
            style={{ backgroundColor: '#d1d5dc' }}
          />
          
          <div className="relative w-full bg-white dark:bg-[var(--card-grid-background)] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border flex items-center gap-4">
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
        </div>
      ))}

      <ViewContactModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        contact={selectedContact as Contact}
        onEdit={handleEdit}
        onExport={handleExport}
      />
    </div>
  )
} 