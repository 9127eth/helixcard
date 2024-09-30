import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen = false, children }) => {
  const [open, setOpen] = useState(isOpen);

  const toggleSection = () => {
    setOpen(!open);
  };

  return (
    <div className="border-b border-gray-300">
      <button
        type="button"
        onClick={toggleSection}
        className="w-full flex justify-between items-center py-4"
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
          viewBox="0 0 20 20"
        >
          <path d="M10 12l-6-6h12z" />
        </svg>
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
