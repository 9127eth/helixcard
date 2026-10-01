'use client'

import { Contact } from '@/app/types'
import { toMillis } from '@/app/lib/contacts'
import { Eye, Edit, Trash2 } from 'lucide-react'
import DropdownMenu from '../DropdownMenu'

// The page owns the contacts and the selection; this only renders them.
interface ContactListProps {
  contacts: Contact[]
  searchQuery: string
  tagFilter: string[]
  isSelectionMode: boolean
  sortOption: 'firstName' | 'dateAdded'
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkAddTag: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onView: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export default function ContactList({ 
  contacts,
  searchQuery, 
  tagFilter, 
  sortOption,
  isSelectionMode,
  selectedIds,
  onSelectionChange,
  onBulkAddTag,
  onBulkExport,
  onBulkDelete,
  onView,
  onEdit,
  onDelete
}: ContactListProps) {
  const toggleSelection = (contactId: string) => {
    onSelectionChange(
      selectedIds.includes(contactId)
        ? selectedIds.filter(id => id !== contactId)
        : [...selectedIds, contactId]
    )
  }

  // Add sorting logic
  const sortContacts = (contacts: Contact[]) => {
    return [...contacts].sort((a, b) => {
      if (sortOption === 'firstName') {
        return a.name.localeCompare(b.name);
      } else { // dateAdded
        // Firestore Timestamps, legacy ISO strings and fresh local contacts alike
        return toMillis(b.dateAdded) - toMillis(a.dateAdded);
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

    // A contact matches if it has any of the selected tags (as on iOS).
    const matchesTags = tagFilter.length === 0 || 
      tagFilter.some(tag => contact.tags?.includes(tag))

    return matchesSearch && matchesTags
  }))

  const allSelected = filteredContacts.length > 0 &&
    filteredContacts.every(contact => selectedIds.includes(contact.id))

  const toggleSelectAll = () => {
    onSelectionChange(allSelected ? [] : filteredContacts.map(c => c.id))
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
                  {allSelected
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {selectedIds.length} selected
                  </span>
                  <span className="text-sm font-medium">
                    Bulk Actions:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={onBulkAddTag}
                      disabled={selectedIds.length === 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add/Remove Tags
                    </button>
                    <button
                      onClick={onBulkExport}
                      disabled={selectedIds.length === 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Export
                    </button>
                    <button
                      onClick={onBulkDelete}
                      disabled={selectedIds.length === 0}
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
                    checked={selectedIds.includes(contact.id)}
                    onChange={() => toggleSelection(contact.id)}
                    className="h-4 w-4 rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <div 
              className="flex items-center gap-4 flex-1 cursor-pointer"
              onClick={() => onView(contact)}
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
                  { label: 'View', onClick: () => onView(contact), icon: Eye },
                  { label: 'Edit', onClick: () => onEdit(contact), icon: Edit },
                  { label: 'Delete', onClick: () => onDelete(contact), icon: Trash2, danger: true },
                ]}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 
