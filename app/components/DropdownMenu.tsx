import React, { useState, useRef, useEffect } from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import Link from 'next/link';

interface DropdownOption {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  href?: string;  // Add this line
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownMenuProps {
  options: DropdownOption[];
}

const IconWrapper: React.FC<{ icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = ({ icon: Icon }) => {
  return <Icon className="mr-3 h-5 w-5" />;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = (option: DropdownOption) => {
    if (option.disabled) return;
    if (option.onClick) {
      option.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <FiMoreHorizontal className="text-gray-600 dark:text-gray-300" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
          {options.map((option, index) => (
            option.href ? (
              <Link
                key={index}
                href={option.href}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : option.danger
                    ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <IconWrapper icon={option.icon} />
                {option.label}
              </Link>
            ) : (
              <button
                key={index}
                onClick={() => handleItemClick(option)}
                disabled={option.disabled}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : option.danger
                    ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <IconWrapper icon={option.icon} />
                {option.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
