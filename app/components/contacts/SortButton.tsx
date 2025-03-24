import { useState, useEffect, useRef } from 'react'
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react'

export type SortOption = 'firstName' | 'dateAdded'

interface SortButtonProps {
  onSort: (option: SortOption) => void
  currentSort: SortOption
}

export default function SortButton({ onSort, currentSort }: SortButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options = [
    { value: 'firstName', label: 'First Name' },
    { value: 'dateAdded', label: 'Recently Added' }
  ]

  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Add event listener if dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-full dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 h-12"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span>Sort by</span>
        <ChevronDown 
          className={`h-3.5 w-3.5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSort(option.value as SortOption)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                currentSort === option.value 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {option.label}
              {currentSort === option.value && (
                <Check className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 