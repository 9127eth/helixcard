import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaDownload, FaEnvelope, FaTimes } from 'react-icons/fa';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface CvViewerProps {
  cvUrl: string;
  onClose: () => void;
}

export const CvViewer: React.FC<CvViewerProps> = ({ cvUrl, onClose }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleDownload = () => {
    window.open(cvUrl, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('My CV');
    const body = encodeURIComponent('Please find my CV attached: ' + cvUrl);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Curriculum Vitae</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={24} />
          </button>
        </div>
        <div className="mb-4 flex justify-center space-x-4">
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            <FaDownload className="mr-2" /> Download
          </button>
          <button
            onClick={handleEmail}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center"
          >
            <FaEnvelope className="mr-2" /> Email
          </button>
        </div>
        <Document
          file={cvUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
        >
          <Page pageNumber={pageNumber} />
        </Document>
        <p className="text-center mt-4">
          Page {pageNumber} of {numPages}
        </p>
        <div className="flex justify-center mt-4 space-x-4">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(pageNumber - 1)}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={pageNumber >= (numPages || 0)}
            onClick={() => setPageNumber(pageNumber + 1)}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};