import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleSectionProps {
  title: string;
  isOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen }) => {
  console.log(`Section "${title}" isOpen:`, isOpen);  // Add this line
  const [open, setOpen] = useState(isOpen);

  const toggleSection = () => {
    setOpen(!open);
  };

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  return (
    <div className="border-b border-gray-300">
      <button
        type="button"
        onClick={toggleSection}
        className="w-full flex justify-between items-center py-4"
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        <FontAwesomeIcon
          icon={open ? faChevronUp : faChevronDown}
          className="w-4 h-4 text-gray-400 transition-transform duration-200"
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-screen' : 'max-h-0'}`}
      >
        <div className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
