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

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset 
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">Create New Contact</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Name *
            </label>
            <input
              id="name"
              {...register('name')}
              placeholder="Enter full name"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
  )
}
