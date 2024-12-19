'use client'

import { Contact, Tag } from '@/app/types'
import { X, Phone, Mail, MessageCircle, Copy, MapPin } from 'react-feather'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import ImageViewerModal from './ImageViewerModal'
import { useAuth } from '@/app/hooks/useAuth'
import { getTags } from '@/app/lib/contacts'

interface ViewContactModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact
  onEdit: (contactId: string) => void
  onExport: (contactId: string) => void
}

export default function ViewContactModal({
  isOpen,
  onClose,
  contact,
  onEdit,
  onExport
}: ViewContactModalProps) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [copySuccess, setCopySuccess] = useState<'phone' | 'email' | 'address' | null>(null)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)

  useEffect(() => {
    const loadTags = async () => {
      if (!user || !isOpen) return
      try {
        const userTags = await getTags(user.uid)
        setTags(userTags)
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }
    loadTags()
  }, [user, isOpen])

  if (!isOpen || !contact) return null

  // Get tag names from IDs with null check
  const tagNames = contact.tags?.map(tagId => {
    const tag = tags.find(t => t.id === tagId)
    return tag?.name || tagId
  }) || []

  const formatPhoneNumber = (phone: string) => {
    const parsed = parsePhoneNumberFromString(phone, 'US')
    return parsed ? parsed.formatNational() : phone
  }

  const copyToClipboard = async (text: string, type: 'phone' | 'email' | 'address') => {
    await navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[500px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{contact.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            {contact.position && (
              <p className="text-gray-600 dark:text-gray-400">{contact.position}</p>
            )}
            {contact.company && (
              <p className="text-gray-600 dark:text-gray-400">{contact.company}</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <>
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  <Phone size={16} />
                  <span>Call</span>
                </a>
                <a
                  href={`sms:${contact.phone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  <MessageCircle size={16} />
                  <span>Text</span>
                </a>
              </>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                <Mail size={16} />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            {contact.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="text-gray-400" size={16} />
                  <span>{formatPhoneNumber(contact.phone)}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(contact.phone!, 'phone')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copySuccess === 'phone' ? (
                    <span className="text-xs">Copied!</span>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="text-gray-400" size={16} />
                  <span>{contact.email}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(contact.email!, 'email')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copySuccess === 'email' ? (
                    <span className="text-xs">Copied!</span>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            )}
            {contact.address && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="text-gray-400" size={16} />
                  <span>{contact.address}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(contact.address!, 'address')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {copySuccess === 'address' ? (
                    <span className="text-xs">Copied!</span>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {contact.note && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {contact.note}
              </p>
            </div>
          )}

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tagNames.map((tagName, index) => (
                  <span
                    key={contact.tags[index]}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
                  >
                    {tagName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Business Card Image */}
          {contact.imageUrl && (
            <div>
              <h4 className="font-medium mb-2">Business Card Image</h4>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={contact.imageUrl}
                  alt="Business card"
                  fill
                  className="object-contain cursor-pointer"
                  sizes="(max-width: 500px) 100vw, 500px"
                  onClick={() => setIsImageViewerOpen(true)}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => onExport(contact.id)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Export
            </button>
            <button
              onClick={() => onEdit(contact.id)}
              className="px-4 py-2 bg-[var(--save-contact-button-bg)] text-[var(--button-text)] rounded-md hover:opacity-90"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {contact.imageUrl && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          imageUrl={contact.imageUrl}
          altText={contact.name}
        />
      )}
    </div>
  )
} 