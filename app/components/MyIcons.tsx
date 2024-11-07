import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const AddDocumentIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M20,22H9a1.99946,1.99946,0,0,1-2-2V10A1.99944,1.99944,0,0,1,9,8H20a1.99944,1.99944,0,0,1,2,2V20A2.0001,2.0001,0,0,1,20,22Z" />
  </svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M0,0h24v24h-24v-24Z" />
  </svg>
);

export const EditPencilIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    fill="none"
    stroke="currentColor"
  >
    <path d="M19.021,12.045v-7c0,-1.105 -0.895,-2 -2,-2h-12c-1.105,0 -2,0.895 -2,2v12c0,1.105 0.895,2 2,2h7" />
    <path d="M20.652,19.262l-1.414,1.414c-0.391,0.391 -1.024,0.391 -1.414,0l-7.531,-7.531c-0.188,-0.187 -0.293,-0.442 -0.293,-0.707v-2.414h2.414c0.265,0 0.52,0.105 0.707,0.293l7.531,7.531c0.391,0.39 0.391,1.023 0,1.414Z" />
    <path d="M18.86,16.06l-2.83,2.82" />
  </svg>
);

export const PreviewIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M0,0h24v24h-24v-24Z" />
  </svg>
);