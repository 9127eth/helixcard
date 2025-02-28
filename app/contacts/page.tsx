'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Tags, CheckSquare, Cpu, Save, Download, Lock, Users } from 'lucide-react'
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
  const [showProTip, setShowProTip] = useState(true)
  const [isContactsLoaded, setIsContactsLoaded] = useState(false)

  // Add a useEffect to log contacts changes for debugging
  useEffect(() => {
    console.log('Contacts state updated:', contacts.length, 'contacts');
  }, [contacts]);

  // Add a useEffect to initialize contacts
  useEffect(() => {
    // If we have a user but contacts haven't been loaded yet, set a timeout to mark contacts as loaded
    // This ensures we don't show the loading spinner indefinitely
    if (user && !isContactsLoaded) {
      const timer = setTimeout(() => {
        console.log('Forcing contacts loaded state after timeout');
        setIsContactsLoaded(true);
      }, 2000); // 2 second timeout
      
      return () => clearTimeout(timer);
    }
  }, [user, isContactsLoaded]);

  // Function to force refresh contacts
  const refreshContacts = () => {
    console.log('Forcing contact list refresh');
    setContactListKey(Date.now().toString());
  };

  // Function to handle successful contact creation
  const handleContactCreated = (newContact: Contact) => {
    console.log('New contact created:', newContact);
    
    // Update the contacts array with the new contact
    setContacts(prevContacts => [newContact, ...prevContacts]);
    
    // Mark contacts as loaded
    setIsContactsLoaded(true);
    
    // Close the modal
    setIsCreateModalOpen(false);
  };

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
      refreshContacts();
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
                {(contacts.length > 0 || isContactsLoaded) && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-9 text-xs bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-full hover:opacity-90"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Contact</span>
                  </button>
                )}
              </div>
              
              {/* Welcome Hero Section - Only show when no contacts and contacts are loaded */}
              {contacts.length === 0 && isContactsLoaded && (
                <div className="mb-8 bg-gradient-to-r from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-3/5 mb-6 md:mb-0 md:pr-8">
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-white">
                        Your Network <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">Organized</span>
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        This is where all your professional connections live. Add contacts manually or use our AI-powered scanning tool on your mobile device to instantly capture business cards.
                      </p>
                      <div className="flex flex-wrap gap-4 mt-6">
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="px-5 py-2 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors duration-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add first contact
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-2/5 flex justify-center">
                      <div className="relative w-48 h-48 md:w-64 md:h-64">
                        <div className="absolute inset-0 bg-[#B8EB41] dark:bg-[#7CCEDA]/20 rounded-full opacity-20 animate-pulse"></div>
                        <div className="absolute inset-4 bg-[#7CCEDA] dark:bg-[#7CCEDA]/40 rounded-full opacity-30"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
                            <Cpu className="w-16 h-16 md:w-20 md:h-20 text-[#7CCEDA]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Subtle Info Banner - Always Visible */}
              {contacts.length > 0 && showProTip && (
                <div className="mb-6 bg-[#F5FDFD] dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-[#7CCEDA] shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 flex-shrink-0">
                        <div className="bg-[#7CCEDA]/20 p-2 rounded-full">
                          <Tags className="h-5 w-5 text-[#7CCEDA]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Pro Tip:</span> Use tags to group your contacts together for easy filtering and bulk exports.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowProTip(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      aria-label="Dismiss tip"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Only show search and filters when there are contacts */}
              {contacts.length > 0 && (
                <>
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
                </>
              )}
            </div>
            
            {/* Contact List - Only show when there are contacts */}
            {contacts.length > 0 ? (
              <>
                <div className="contact-list-empty-check" style={{ display: 'none' }}></div>
                <ContactList 
                  key={contactListKey}
                  searchQuery={searchQuery} 
                  tagFilter={selectedTags}
                  sortOption={sortOption}
                  isSelectionMode={isSelectionMode}
                  onSelectionChange={handleSelectionChange}
                  onContactsChange={(newContacts) => {
                    console.log('ContactList onContactsChange called with', newContacts.length, 'contacts');
                    setContacts(newContacts);
                    setIsContactsLoaded(true);
                  }}
                  onBulkAddTag={handleBulkAddTag}
                  onBulkExport={handleBulkExport}
                  onBulkDelete={handleBulkDelete}
                  onView={handleViewContact}
                  onEdit={handleEditContact}
                />
              </>
            ) : (
              isContactsLoaded ? (
                /* Enhanced Empty State - Reduced top margin */
                <div className="mt-4 mb-24">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F5FDFD] dark:bg-gray-700 rounded-full mb-6">
                        <Users className="h-10 w-10 text-[#7CCEDA]" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Your Contact List is Empty</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Start building your network by adding your first contact. You can add contacts manually or import them using our AI scanner.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* AI Scanning */}
                      <div className="flex flex-col items-center p-6 bg-[#F5FDFD] dark:bg-gray-700/50 rounded-lg">
                        <div className="w-12 h-12 mb-3 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded-full">
                          <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-center">AI-Powered Scanning</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Quickly scan business cards with our advanced AI and vision technology.
                        </p>
                      </div>

                      {/* Contacts Access */}
                      <div className="flex flex-col items-center p-6 bg-[#F5FDFD] dark:bg-gray-700/50 rounded-lg">
                        <div className="w-12 h-12 mb-3 flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-full">
                          <Save className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-center">Contacts Always at Your Fingertips</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Your scanned contacts are always at your fingertips. Never lose a contact again.
                        </p>
                      </div>

                      {/* Export Feature */}
                      <div className="flex flex-col items-center p-6 bg-[#F5FDFD] dark:bg-gray-700/50 rounded-lg">
                        <div className="w-12 h-12 mb-3 flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 rounded-full">
                          <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-center">Simple Export</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Effortlessly export your contacts, making them ready for seamless import into your favorite CRM.
                        </p>
                      </div>

                      {/* Security */}
                      <div className="flex flex-col items-center p-6 bg-[#F5FDFD] dark:bg-gray-700/50 rounded-lg">
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
                </div>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCEDA]"></div>
                </div>
              )
            )}
          </div>
          <div className="hidden lg:block lg:w-[30%] bg-background"></div>
        </div>
      </div>

      {/* Modals */}
      <CreateContactModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleContactCreated}
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
              setSelectedContact(null)
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