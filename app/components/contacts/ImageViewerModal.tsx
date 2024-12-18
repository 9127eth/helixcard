'use client'

import { X, ZoomIn, ZoomOut } from 'react-feather'
import { useState } from 'react'
import Image from 'next/image'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  altText: string
}

export default function ImageViewerModal({
  isOpen,
  onClose,
  imageUrl,
  altText
}: ImageViewerModalProps) {
  const [scale, setScale] = useState(1)

  if (!isOpen) return null

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]">
      <div className="relative w-full h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 z-10"
        >
          <X size={24} />
        </button>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
          >
            <ZoomOut size={24} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
          >
            <ZoomIn size={24} />
          </button>
        </div>

        {/* Image container */}
        <div className="w-full h-full flex items-center justify-center overflow-auto">
          <div
            style={{
              transform: `scale(${scale})`,
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <Image
              src={imageUrl}
              alt={altText}
              width={800}
              height={600}
              className="object-contain max-w-full max-h-full"
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 