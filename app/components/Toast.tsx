'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete before removing
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg flex items-center transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${
        type === 'success'
          ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-800'
      }`}
    >
      {type === 'success' ? (
        <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500 dark:text-green-300" />
      ) : (
        <XCircleIcon className="w-5 h-5 mr-2 text-red-500 dark:text-red-300" />
      )}
      <span className="flex-1">{message}</span>
      <button 
        onClick={handleClose}
        className="ml-4 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast; 