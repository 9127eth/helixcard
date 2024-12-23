'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import TagSelector from './TagSelector'
import { Contact } from '@/app/types'
import { createContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { X } from 'react-feather'
import { ContactOCRUpload } from '../ContactOCRUpload'
import { Camera, Edit } from 'react-feather'

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

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue 
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  const handleOCRComplete = (contactData: Partial<Contact>) => {
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
      setValue('phone', contactData.phone)
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
    if (!user) return

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
        contactSource: 'manual',
      }

      const createdContact = await createContact(user.uid, newContact)
      onSuccess?.(createdContact)
      reset()
      setSelectedTags(lastUsedTag ? [lastUsedTag] : [])
      onClose()
    } catch (error) {
      console.error('Error creating contact:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Show entry method selection if no method chosen
  if (entryMethod === null) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create New Contact</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg">
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
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                onClick={onClose}
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
  )
}
