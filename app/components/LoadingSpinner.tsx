import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = true }) => {
  const containerClasses = fullScreen 
    ? "flex justify-center items-center h-screen"
    : "flex justify-center items-center p-4";

  return (
    <div className={containerClasses}>
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#7CCEDA] rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;