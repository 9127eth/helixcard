'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import TagSelector from './TagSelector'
import { Contact } from '@/app/types'
import { createContact, uploadContactImage, updateContact, canCreateContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { X } from 'react-feather'
import { ContactOCRUpload } from '../ContactOCRUpload'
import { Camera, Edit } from 'react-feather'
import { FREE_USER_CONTACT_LIMIT } from '@/app/lib/constants'
import CardLimitModal from '../CardLimitModal'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
})

type ContactFormData = z.infer<typeof contactSchema>

interface CreateContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (contact: Contact) => void
  lastUsedTag?: string
}

type EntryMethod = 'manual' | 'scan' | null;

interface ScannedData extends Partial<Contact> {
  imageFile?: File;
}

export default function CreateContactModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  lastUsedTag 
}: CreateContactModalProps) {
  const { user } = useAuth()
  const [selectedTags, setSelectedTags] = useState<string[]>(
    lastUsedTag ? [lastUsedTag] : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entryMethod, setEntryMethod] = useState<EntryMethod>(null)
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedData | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [isPro, setIsPro] = useState(false)

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue,
    getValues 
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  useEffect(() => {
    const checkCanCreate = async () => {
      if (user && db) {
        try {
          const canCreate = await canCreateContact(user.uid)
          if (!canCreate) {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            setIsPro(userDoc.data()?.isPro || false)
            setShowLimitModal(true)
          }
        } catch (error) {
          console.error('Error checking contact creation limit:', error)
        }
      }
    }

    if (isOpen) {
      checkCanCreate()
    }
  }, [isOpen, user])

  const handleOCRComplete = (contactData: Partial<Contact> & { imageFile?: File }) => {
    setScannedData(contactData)
    // Set form values with OCR data
    const fields = new Set<string>()
    
    if (contactData.name) {
      setValue('name', contactData.name)
      fields.add('name')
    }
    if (contactData.email) {
      setValue('email', contactData.email)
      fields.add('email')
    }
    if (contactData.phone) {
      // Parse and format the phone number
      const phoneNumber = parsePhoneNumberFromString(String(contactData.phone), 'US')
      setValue('phone', phoneNumber ? phoneNumber.format('NATIONAL') : String(contactData.phone))
      fields.add('phone')
    }
    if (contactData.position) {
      setValue('position', contactData.position)
      fields.add('position')
    }
    if (contactData.company) {
      setValue('company', contactData.company)
      fields.add('company')
    }
    if (contactData.address) {
      setValue('address', contactData.address)
      fields.add('address')
    }

    setAutoFilledFields(fields)
    setEntryMethod('scan')
  }

  const handleOCRError = (error: string) => {
    // TODO: Show error toast
    console.error('OCR Error:', error)
  }

  // Rest of the component remains the same, but we'll add highlighting for auto-filled fields
  const getInputClassName = (fieldName: string) => {
    return `w-full px-2 py-1 border rounded-md text-sm 
      ${autoFilledFields.has(fieldName) 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700'} 
      dark:text-[var(--input-text)]`
  }

  const onSubmit = async (data: ContactFormData) => {
    if (!user) {
      console.error('No user found')
      return
    }

    setIsSubmitting(true)
    try {
      // Format phone number if provided
      let formattedPhone = data.phone
      if (data.phone) {
        const phoneNumber = parsePhoneNumberFromString(data.phone, 'US')
        if (phoneNumber) {
          formattedPhone = phoneNumber.format('E.164')
        }
      }

      // Parse name into first and last name
      const nameParts = data.name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      const newContact: Partial<Contact> = {
        name: data.name.trim(),
        firstName,
        lastName: lastName || '',
        email: data.email || '',
        phone: formattedPhone || '',
        position: data.position || '',
        company: data.company || '',
        address: data.address || '',
        note: data.note || '',
        tags: selectedTags,
        contactSource: entryMethod === 'scan' ? 'scanned' : 'manual'
      }

      // First create the contact
      const createdContact = await createContact(user.uid, newContact)

      // Then upload image if exists and update contact
      if (scannedData?.imageFile) {
        const imageUrl = await uploadContactImage(user.uid, createdContact.id, scannedData.imageFile)
        await updateContact(user.uid, createdContact.id, { imageUrl })
        createdContact.imageUrl = imageUrl
      }

      onSuccess?.(createdContact)
      reset()
      setSelectedTags(lastUsedTag ? [lastUsedTag] : [])
      onClose()
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Failed to create contact. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (autoFilledFields.size > 0 || Object.values(getValues()).some(value => value)) {
      setShowConfirmation(true)
    } else {
      handleConfirmedCancel()
    }
  }

  const handleConfirmedCancel = () => {
    reset() // Clear form data
    setSelectedTags(lastUsedTag ? [lastUsedTag] : [])
    setAutoFilledFields(new Set())
    setEntryMethod(null)
    setShowConfirmation(false)
    onClose()
  }

  const handleClose = () => {
    if (autoFilledFields.size > 0 || Object.values(getValues()).some(value => value)) {
      setShowConfirmation(true)
    } else {
      handleConfirmedCancel()
    }
  }

  const handleLimitModalClose = () => {
    setShowLimitModal(false)
    onClose()
  }

  if (!isOpen) return null

  // Show entry method selection if no method chosen
  if (entryMethod === null) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create New Contact</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEntryMethod('scan')}
                className="flex-1 p-6 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="font-medium">Scan Business Card</span>
                  <span className="text-sm text-gray-500">Upload an image to automatically extract contact details</span>
                </div>
              </button>

              <button
                onClick={() => setEntryMethod('manual')}
                className="flex-1 p-6 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <Edit className="w-8 h-8 text-gray-400" />
                  <span className="font-medium">Manual Entry</span>
                  <span className="text-sm text-gray-500">Enter contact information manually</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show OCR upload or form based on selected method
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto pt-4 px-4 pb-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg my-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Contact</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEntryMethod(null)}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Change Method
                </button>
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {entryMethod === 'scan' && (
              <ContactOCRUpload
                onScanComplete={handleOCRComplete}
                onError={handleOCRError}
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Name *
                </label>
                <input
                  id="name"
                  {...register('name')}
                  placeholder="Enter full name"
                  className={getInputClassName('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Email address"
                    className={getInputClassName('email')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone
                  </label>
                  <input
                    id="phone"
                    {...register('phone')}
                    placeholder="Phone number"
                    className={getInputClassName('phone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="position" className="block text-sm font-medium">
                    Position
                  </label>
                  <input
                    id="position"
                    {...register('position')}
                    placeholder="Job title"
                    className={getInputClassName('position')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="company" className="block text-sm font-medium">
                    Company
                  </label>
                  <input
                    id="company"
                    {...register('company')}
                    placeholder="Company name"
                    className={getInputClassName('company')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm font-medium">
                  Address
                </label>
                <input
                  id="address"
                  {...register('address')}
                  placeholder="Address"
                  className={getInputClassName('address')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Tags</label>
                <TagSelector
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="note" className="block text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="note"
                  {...register('note')}
                  placeholder="Add a note..."
                  rows={3}
                  className={getInputClassName('note')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-full hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmation(false)} />
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to cancel? All unsaved changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmedCancel}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <CardLimitModal
          isPro={isPro}
          limit={FREE_USER_CONTACT_LIMIT}
          onClose={handleLimitModalClose}
          type="contact"
        />
      )}
    </div>
  )
}
