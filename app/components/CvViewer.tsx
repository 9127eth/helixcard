import React from 'react';

interface CvViewerProps {
  cvUrl: string;
}

export const CvViewer: React.FC<CvViewerProps> = ({ cvUrl }) => {
  return (
    <div className="cv-viewer">
      <iframe src={cvUrl} width="100%" height="600px" />
    </div>
  );
};
