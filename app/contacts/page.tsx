'use client'

import { useState } from 'react'
import { Plus, Search, Tags, CheckSquare } from 'lucide-react'
import Layout from '../components/Layout'
import ContactList from '../components/contacts/ContactList'
import CreateContactModal from '../components/contacts/CreateContactModal'
import ManageTagsModal from '../components/contacts/ManageTagsModal'
import TagSelector from '../components/contacts/TagSelector'
import BulkTagModal from '../components/contacts/BulkTagModal'
import ViewContactModal from '../components/contacts/ViewContactModal'
import EditContactModal from '../components/contacts/EditContactModal'
import ExportContactsModal from '../components/contacts/ExportContactsModal'
import { Contact } from '../types'
import { batchDeleteContacts } from '../lib/contacts'
import { useAuth } from '../hooks/useAuth'
import SortButton from '../components/contacts/SortButton'

export default function ContactsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false)
  const [contactListKey, setContactListKey] = useState(Date.now().toString())
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sortOption, setSortOption] = useState<'firstName' | 'dateAdded'>('dateAdded')

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedContacts(selectedIds)
  }
  const handleBulkDelete = async () => {
    if (!user || !selectedContacts.length) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedContacts.length} contact(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await batchDeleteContacts(user.uid, selectedContacts);
      // Force refresh the contact list
      setContactListKey(Date.now().toString());
      setSelectedContacts([]);
    } catch (error) {
      console.error('Error deleting contacts:', error);
      // TODO: Show error toast
    }
  };

  const handleBulkExport = () => {
    setIsExportModalOpen(true)
  }

  const handleBulkAddTag = () => {
    setIsBulkTagModalOpen(true)
  }

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsViewModalOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsEditModalOpen(true)
  }

  return (
    <Layout title="Contacts - HelixCard" showSidebar={true}>
      <div className="flex justify-center">
        <div className="w-full max-w-[1200px] flex">
          <div className="w-full lg:w-[70%] pl-4 lg:pl-8 pr-4 lg:pr-12">
            {/* Header */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-5xl font-bold">Contacts</h1>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-12 text-sm bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-full hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>
              
              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <TagSelector 
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    isFilter={true}
                    allowCreate={false}
                  />
                  <button
                    onClick={() => setIsManageTagsOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 min-w-[80px]"
                  >
                    <Tags className="h-3.5 w-3.5" />
                    <span>Tags</span>
                  </button>
                  <SortButton 
                    currentSort={sortOption}
                    onSort={setSortOption}
                  />
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-full dark:border-gray-600 min-w-[80px] ${
                      isSelectionMode 
                        ? 'bg-gray-300 dark:bg-gray-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Contact List */}
            <ContactList 
              key={contactListKey}
              searchQuery={searchQuery} 
              tagFilter={selectedTags}
              sortOption={sortOption}
              isSelectionMode={isSelectionMode}
              onSelectionChange={handleSelectionChange}
              onContactsChange={setContacts}
              onBulkAddTag={handleBulkAddTag}
              onBulkExport={handleBulkExport}
              onBulkDelete={handleBulkDelete}
              onView={handleViewContact}
              onEdit={handleEditContact}
            />
          </div>
          <div className="hidden lg:block lg:w-[30%] bg-background"></div>
        </div>
      </div>

      {/* Modals */}
      <CreateContactModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Force refresh the contact list
          setContactListKey(Date.now().toString())
        }}
        lastUsedTag={selectedTags[0]}
      />

      <ManageTagsModal 
        isOpen={isManageTagsOpen}
        onClose={() => setIsManageTagsOpen(false)}
      />

      <BulkTagModal
        isOpen={isBulkTagModalOpen}
        onClose={() => setIsBulkTagModalOpen(false)}
        selectedContactIds={selectedContacts}
        onSuccess={() => {
          // Force refresh the contact list
          const contactListKey = Date.now().toString();
          setContactListKey(contactListKey);
          setSelectedContacts([]); // Clear selection after successful update
        }}
      />

      {selectedContact && (
        <>
          <ViewContactModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            contact={selectedContact}
            onEdit={() => {
              setIsViewModalOpen(false)
              setIsEditModalOpen(true)
            }}
            onExport={(contactId) => {
              setSelectedContacts([contactId])
              setIsExportModalOpen(true)
            }}
          />

          <EditContactModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setIsViewModalOpen(true)
            }}
            contact={selectedContact}
            onSuccess={(updatedContact) => {
              setIsEditModalOpen(false)
              setIsViewModalOpen(true)
              setSelectedContact(updatedContact)
              // Force refresh the contact list in background
              setContactListKey(Date.now().toString())
            }}
          />
        </>
      )}

      <ExportContactsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedContacts={contacts.filter((c: Contact) => selectedContacts.includes(c.id))}
      />
    </Layout>
  )
} 