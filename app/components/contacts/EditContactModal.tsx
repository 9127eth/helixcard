'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { X, Trash2, Edit3, Upload, Check } from 'react-feather'
import Image from 'next/image'
import TagSelector from './TagSelector'
import { Contact } from '@/app/types'
import { updateContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { deleteImage, uploadContactImage } from '@/app/lib/storage'
import {
  inputClass, textareaClass, labelClass, btnPrimary, btnSecondary,
  iconButtonClass, sectionIconClass, Field,
} from '../ui/editor'

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
  const [selectedTags, setSelectedTags] = useState<string[]>(() => contact.tags || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(!contact.imageUrl)
  const [isImageDeleted, setIsImageDeleted] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
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

  // Reset form values when contact changes
  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        company: contact.company || '',
        address: contact.address || '',
        note: contact.note || '',
      });
      setSelectedTags(contact.tags);
      setShowImageUpload(!contact.imageUrl);
      setIsImageDeleted(false);
      setImageFile(null);
      setImageToDelete(null);
      setImagePreview(previousPreview => {
        if (previousPreview) URL.revokeObjectURL(previousPreview);
        return null;
      });
    }
  }, [contact, reset]);

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

  const handleCancel = () => {
    onClose()
    // Any pending image changes will be discarded
    setImageFile(null)
    setIsImageDeleted(false)
    setShowImageUpload(!contact.imageUrl)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          role="dialog"
          aria-modal="true"
          aria-label="Edit contact"
          className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-[#2c2d31] dark:ring-white/10 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4 dark:border-white/10">
            <div className="flex min-w-0 items-center gap-3">
              <span className={sectionIconClass}>
                <Edit3 size={16} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight">Edit contact</h2>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{contact.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={iconButtonClass}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Field label="Name" htmlFor="name" required error={errors.name?.message}>
                <input
                  id="name"
                  {...register('name')}
                  placeholder="Full name"
                  aria-invalid={!!errors.name}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="name@company.com"
                    aria-invalid={!!errors.email}
                    className={inputClass}
                  />
                </Field>

                <Field label="Phone" htmlFor="phone">
                  <input
                    id="phone"
                    {...register('phone')}
                    placeholder="Phone number"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Position" htmlFor="position">
                  <input
                    id="position"
                    {...register('position')}
                    placeholder="Job title"
                    className={inputClass}
                  />
                </Field>

                <Field label="Company" htmlFor="company">
                  <input
                    id="company"
                    {...register('company')}
                    placeholder="Company name"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Address" htmlFor="address">
                <input
                  id="address"
                  {...register('address')}
                  placeholder="Address"
                  className={inputClass}
                />
              </Field>

              <Field label="Notes" htmlFor="note">
                <textarea
                  id="note"
                  {...register('note')}
                  placeholder="Where you met, what you talked about…"
                  rows={3}
                  className={textareaClass}
                />
              </Field>

              <div>
                <span className={labelClass}>Tags</span>
                <TagSelector
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  isFilter={false}
                  allowCreate={true}
                />
              </div>

              <div>
                <span className={labelClass}>Business card image</span>

                {!showImageUpload && (imagePreview || contact.imageUrl) && (
                  <div className="relative overflow-hidden rounded-xl border border-black/[0.06] bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="relative h-48 w-full">
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
                      className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 dark:bg-black/60 dark:text-red-400 dark:ring-white/10 dark:hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {(showImageUpload || isImageDeleted) && (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center transition focus-within:ring-4 focus-within:ring-[#7CCEDA]/30 hover:border-[#7CCEDA] hover:bg-[#7CCEDA]/5 dark:border-white/15 dark:hover:bg-[#7CCEDA]/10">
                    <span className={sectionIconClass}>
                      <Upload size={16} />
                    </span>
                    <span className="text-sm font-medium">Upload an image</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">A photo of their business card, for example.</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] bg-gray-50/70 px-5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <button
                type="button"
                onClick={handleCancel}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={btnPrimary}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
