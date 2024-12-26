'use client'

import { useState } from 'react'
import { Plus, Search, Tags, CheckSquare, Cpu, Save, Download, Lock } from 'lucide-react'
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
            <div className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-5xl font-bold">Contacts</h1>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-12 text-sm bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-full hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>
              
              {/* Search Bar with fixed width */}
              <div className="mb-4">
                <div className="relative w-[400px]">
                  <Search className="absolute left-3 top-[50%] -translate-y-[70%] text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-full dark:border-gray-600 dark:bg-gray-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters Row - Left aligned with consistent button heights */}
              <div className="flex items-center gap-2">
                <TagSelector 
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  isFilter={true}
                  allowCreate={false}
                />
                <button
                  onClick={() => setIsManageTagsOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-12 text-sm border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 min-w-[80px]"
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
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 h-12 text-sm border border-gray-300 rounded-full dark:border-gray-600 min-w-[80px] ${
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

      {contacts.length <= 2 && (
        <div className="w-full lg:w-[70%] pl-4 lg:pl-8 pr-4 lg:pr-12 -mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
            {/* AI Scanning */}
            <div className="flex flex-col items-center p-6 bg-white dark:bg-[#2c2d31] rounded-lg shadow-sm">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">AI-Powered Scanning</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Quickly scan business cards with our advanced AI and vision technology.
              </p>
            </div>

            {/* Contacts Access */}
            <div className="flex flex-col items-center p-6 bg-white dark:bg-[#2c2d31] rounded-lg shadow-sm">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-full">
                <Save className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Contacts Always at Your Fingertips</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Your scanned contacts are always at your fingertips. Never lose a contact again.
              </p>
            </div>

            {/* Export Feature */}
            <div className="flex flex-col items-center p-6 bg-white dark:bg-[#2c2d31] rounded-lg shadow-sm">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Simple Export</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Effortlessly export your contacts, making them ready for seamless import into your favorite CRM.
              </p>
            </div>

            {/* Security */}
            <div className="flex flex-col items-center p-6 bg-white dark:bg-[#2c2d31] rounded-lg shadow-sm">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Secure Storage</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Your contacts are securely stored and protected.
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
} 