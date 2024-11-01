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
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#B8EB41]"></div>
    </div>
  );
};

export default LoadingSpinner;