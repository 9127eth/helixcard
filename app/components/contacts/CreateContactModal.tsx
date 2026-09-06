'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { X, Camera, Edit3, UserPlus, AlertTriangle, CheckCircle, ArrowLeft } from 'react-feather'
import TagSelector from './TagSelector'
import { Contact } from '@/app/types'
import { createContact, uploadContactImage, updateContact, canCreateContact } from '@/app/lib/contacts'
import { useAuth } from '@/app/hooks/useAuth'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { ContactOCRUpload } from '../ContactOCRUpload'
import { FREE_USER_CONTACT_LIMIT } from '@/app/lib/constants'
import CardLimitModal from '../CardLimitModal'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { cn } from '@/app/lib/utils'
import {
  inputClass, textareaClass, labelClass, btnPrimary, btnSecondary, btnGhost, btnDanger,
  iconButtonClass, sectionIconClass, Field,
} from '../ui/editor'

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

const autoFilledClass = 'border-[#7CCEDA] bg-[#7CCEDA]/10 dark:bg-[#7CCEDA]/10'

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

  // Auto-filled fields get a teal tint so scanned values are easy to double-check
  const getInputClassName = (fieldName: string, base: string = inputClass) =>
    cn(base, autoFilledFields.has(fieldName) && autoFilledClass)

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

  const panelMotion = {
    initial: { opacity: 0, y: 24, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 36 },
  }

  const renderHeader = (subtitle: string) => (
    <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3">
        <span className={sectionIconClass}>
          <UserPlus size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">New contact</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {entryMethod !== null && (
          <button
            type="button"
            onClick={() => setEntryMethod(null)}
            className={btnGhost}
            aria-label="Change entry method"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Change method</span>
          </button>
        )}
        <button type="button" onClick={handleClose} className={iconButtonClass} aria-label="Close">
          <X size={18} />
        </button>
      </div>
    </div>
  )

  // Show entry method selection if no method chosen
  if (entryMethod === null) {
    return (
      <div className="fixed inset-0 z-50 font-sans">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
        <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            {...panelMotion}
            role="dialog"
            aria-modal="true"
            aria-label="New contact"
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-[#2c2d31] dark:ring-white/10 sm:rounded-2xl"
          >
            {renderHeader('How would you like to add them?')}
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEntryMethod('scan')}
                className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-black/[0.06] p-4 text-left transition hover:border-[#7CCEDA] hover:bg-[#7CCEDA]/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 dark:border-white/10 dark:hover:border-[#7CCEDA]"
              >
                <span className={sectionIconClass}>
                  <Camera size={16} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Scan a business card</span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Snap a photo and we&apos;ll pull out the details automatically.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEntryMethod('manual')}
                className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-black/[0.06] p-4 text-left transition hover:border-[#7CCEDA] hover:bg-[#7CCEDA]/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 dark:border-white/10 dark:hover:border-[#7CCEDA]"
              >
                <span className={sectionIconClass}>
                  <Edit3 size={16} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Enter manually</span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Type in their name, contact details, and notes yourself.
                  </span>
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Show OCR upload or form based on selected method
  return (
    <div className="fixed inset-0 z-50 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <motion.div
          {...panelMotion}
          role="dialog"
          aria-modal="true"
          aria-label="New contact"
          className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-[#2c2d31] dark:ring-white/10 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
        >
          {renderHeader(entryMethod === 'scan' ? 'Scanned from a business card' : 'Entered manually')}

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {entryMethod === 'scan' && (
                <ContactOCRUpload
                  onScanComplete={handleOCRComplete}
                  onError={handleOCRError}
                />
              )}

              {autoFilledFields.size > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#7CCEDA]/40 bg-[#7CCEDA]/10 px-3.5 py-3 text-sm">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-[#2E7C89] dark:text-[#7CCEDA]" />
                  <p className="text-gray-700 dark:text-gray-200">
                    We filled in the highlighted fields from the scan. Give them a quick check before saving.
                  </p>
                </div>
              )}

              <Field label="Name" htmlFor="name" required error={errors.name?.message}>
                <input
                  id="name"
                  {...register('name')}
                  placeholder="Full name"
                  aria-invalid={!!errors.name}
                  className={getInputClassName('name')}
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
                    className={getInputClassName('email')}
                  />
                </Field>

                <Field label="Phone" htmlFor="phone">
                  <input
                    id="phone"
                    {...register('phone')}
                    placeholder="Phone number"
                    className={getInputClassName('phone')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Position" htmlFor="position">
                  <input
                    id="position"
                    {...register('position')}
                    placeholder="Job title"
                    className={getInputClassName('position')}
                  />
                </Field>

                <Field label="Company" htmlFor="company">
                  <input
                    id="company"
                    {...register('company')}
                    placeholder="Company name"
                    className={getInputClassName('company')}
                  />
                </Field>
              </div>

              <Field label="Address" htmlFor="address">
                <input
                  id="address"
                  {...register('address')}
                  placeholder="Address"
                  className={getInputClassName('address')}
                />
              </Field>

              <div>
                <span className={labelClass}>Tags</span>
                <TagSelector
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                />
              </div>

              <Field label="Notes" htmlFor="note">
                <textarea
                  id="note"
                  {...register('note')}
                  placeholder="Where you met, what you talked about…"
                  rows={3}
                  className={getInputClassName('note', textareaClass)}
                />
              </Field>
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
                    Creating…
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create contact
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Add confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmation(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            role="alertdialog"
            aria-modal="true"
            aria-label="Discard changes?"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 dark:bg-[#2c2d31] dark:ring-white/10"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-tight">Discard changes?</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Anything you&apos;ve entered for this contact will be lost.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className={btnSecondary}
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleConfirmedCancel}
                className={btnDanger}
              >
                Discard
              </button>
            </div>
          </motion.div>
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
