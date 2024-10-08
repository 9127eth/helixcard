import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'react-feather';

interface CollapsibleSectionProps {
  title: string;
  isOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen }) => {
  const [open, setOpen] = useState(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSection = () => {
    setOpen(!open);
  };

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (contentRef.current) {
      if (open) {
        contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
      } else {
        contentRef.current.style.maxHeight = '0';
      }
    }
  }, [open, children]);

  return (
    <div className="border-b border-gray-300 dark:border-gray-700">
      <button
        type="button"
        onClick={toggleSection}
        className="w-full flex justify-between items-center py-4 px-4 hover:bg-gray-100 dark:hover:bg-[#2c2d31] transition-colors duration-200"
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-300" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300" />
        )}
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: open ? `${contentRef.current?.scrollHeight}px` : '0' }}
      >
        <div className={`py-4 px-4 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
