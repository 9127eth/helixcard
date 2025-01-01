'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Trash2 } from 'react-feather'
import Image from 'next/image'
import TagSelector from './TagSelector'
import { Contact } from '@/app/types'
import { updateContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { deleteImage, uploadContactImage } from '@/app/lib/storage'

// Reuse the same validation schema from CreateContactModal
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

interface EditContactModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact
  onSuccess?: (contact: Contact) => void
}

export default function EditContactModal({
  isOpen,
  onClose,
  contact,
  onSuccess
}: EditContactModalProps) {
  const { user } = useAuth()
  const [selectedTags, setSelectedTags] = useState<string[]>(contact.tags)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(!contact.imageUrl)
  const [isImageDeleted, setIsImageDeleted] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      company: contact.company || '',
      address: contact.address || '',
      note: contact.note || '',
    }
  })

  const handleImageDelete = async () => {
    setIsImageDeleted(true)
    setShowImageUpload(true)
    setImageFile(null)
    if (contact.imageUrl) {
      setImageToDelete(contact.imageUrl)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setIsImageDeleted(false)
      setShowImageUpload(false)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const onSubmit = async (data: ContactFormData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      let formattedPhone = data.phone
      if (data.phone) {
        const phoneNumber = parsePhoneNumberFromString(data.phone, 'US')
        if (phoneNumber) {
          formattedPhone = phoneNumber.format('E.164')
        }
      }

      // Handle image updates
      let newImageUrl = contact.imageUrl
      
      // Delete old image if marked for deletion
      if (imageToDelete) {
        await deleteImage(imageToDelete)
        newImageUrl = ''
      }

      // Upload new image if provided
      if (imageFile) {
        newImageUrl = await uploadContactImage(user.uid, contact.id, imageFile)
      }

      const updates: Partial<Contact> = {
        name: data.name.trim(),
        email: data.email || '',
        phone: formattedPhone || '',
        position: data.position || '',
        company: data.company || '',
        address: data.address || '',
        note: data.note || '',
        tags: selectedTags
      }

      // Only include imageUrl in updates if it has changed
      if (newImageUrl !== contact.imageUrl) {
        updates.imageUrl = newImageUrl
      }

      await updateContact(user.uid, contact.id, updates)
      onSuccess?.({ ...contact, ...updates })
      onClose()
    } catch (error) {
      console.error('Error updating contact:', error)
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
          <h2 className="text-xl font-semibold">Edit Contact</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-xs mb-1 font-bold text-gray-400">
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
              <label htmlFor="email" className="block text-xs mb-1 font-bold text-gray-400">
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
              <label htmlFor="phone" className="block text-xs mb-1 font-bold text-gray-400">
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
              <label htmlFor="position" className="block text-xs mb-1 font-bold text-gray-400">
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
              <label htmlFor="company" className="block text-xs mb-1 font-bold text-gray-400">
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
            <label htmlFor="address" className="block text-xs mb-1 font-bold text-gray-400">
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
            <label htmlFor="note" className="block text-xs mb-1 font-bold text-gray-400">
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

          <div className="space-y-2">
            <label className="block text-xs mb-1 font-bold text-gray-400">Tags</label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              isFilter={false}
              allowCreate={true}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Image
            </label>
            
            {!showImageUpload && (imagePreview || contact.imageUrl) && (
              <div className="relative">
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={imagePreview || contact.imageUrl || ''}
                    alt="Business card"
                    fill
                    className="object-contain"
                    sizes="(max-width: 500px) 100vw, 500px"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {(showImageUpload || isImageDeleted) && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                // Any pending image changes will be discarded
                setImageFile(null)
                setIsImageDeleted(false)
                setShowImageUpload(!contact.imageUrl)
                if (imagePreview) {
                  URL.revokeObjectURL(imagePreview)
                  setImagePreview(null)
                }
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-full hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 