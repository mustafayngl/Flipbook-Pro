import React, { useState, useEffect } from 'react';
import PdfViewer from './components/PdfViewer';
import './app.css';

function App() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        const fileUrl = URL.createObjectURL(file);
        setPdfUrl(fileUrl);
        setFileError(null);
      } else {
        setFileError('Please upload a valid PDF file.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div>
      {!pdfUrl ? (
        <div className="file-upload-container">
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          {fileError && <p className="error-message">{fileError}</p>}
          <p>Please upload a PDF file to start viewing.</p>
        </div>
      ) : (
        <PdfViewer pdfUrl={pdfUrl} />
      )}
    </div>
  );
}

export default App;
