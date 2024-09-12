import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import './PdfViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js';

interface PdfViewerProps {
  pdfUrl: string;
}

function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [drawingMode, setDrawingMode] = useState<'pen' | 'eraser' | 'pointer'>(
    'pointer',
  );
  const [drawing, setDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [canvasOffsetX, setCanvasOffsetX] = useState<number>(0);
  const [canvasOffsetY, setCanvasOffsetY] = useState<number>(0);

  const onDocumentLoadSuccess = ({
    numPages: loadedNumPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(loadedNumPages);
    setCurrentPage(1);
  };

  const onDocumentLoadError = (error: Error) => {
    setLoadError(error);
  };

  const goToPrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, numPages || 1));
  };

  const handlePageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPage(Number(event.target.value));
  };

  const zoomIn = () => setScale((prevScale) => prevScale + 0.1);
  const zoomOut = () => setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0 && drawingMode === 'pointer') {
      setDragging(true);
      setDragStartX(event.nativeEvent.clientX);
      setDragStartY(event.nativeEvent.clientY);
    } else if (canvasRef.current && drawingMode !== 'pointer') {
      setDrawing(true);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        contextRef.current = ctx;
        ctx.beginPath();
        ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      }
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawing && contextRef.current) {
      const ctx = contextRef.current;
      const { offsetX, offsetY } = event.nativeEvent;

      if (drawingMode === 'pen') {
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
      } else if (drawingMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.arc(offsetX, offsetY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    } else if (dragging) {
      const offsetX = event.nativeEvent.clientX - dragStartX;
      const offsetY = event.nativeEvent.clientY - dragStartY;
      setCanvasOffsetX(canvasOffsetX + offsetX);
      setCanvasOffsetY(canvasOffsetY + offsetY);
      setDragStartX(event.nativeEvent.clientX);
      setDragStartY(event.nativeEvent.clientY);
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
    setDragging(false);
    if (contextRef.current) {
      contextRef.current.closePath();
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).willReadFrequently = true;
    }
  }, []);

  return (
    <div className="pdf-viewer-container">
      {loadError ? (
        <div className="error-message">
          Error loading PDF: {loadError.message}
        </div>
      ) : (
        <>
          <div className="pdf-content">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
            >
              <Page pageNumber={currentPage} scale={scale} />
            </Document>
            <canvas
              ref={canvasRef}
              width={scale * 1000}
              height={scale * 1500}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                transform: `translate(${canvasOffsetX}px, ${canvasOffsetY}px)`,
              }}
            />
          </div>
          <div className="fixed-controls">
            <button type="button" onClick={zoomIn}>
              Zoom In
            </button>
            <button type="button" onClick={zoomOut}>
              Zoom Out
            </button>
            <button type="button" onClick={() => setDrawingMode('pen')}>
              Pen
            </button>
            <button type="button" onClick={() => setDrawingMode('eraser')}>
              Eraser
            </button>
            <button
              type="button"
              onClick={() => {
                if (canvasRef.current && contextRef.current) {
                  contextRef.current.clearRect(
                    0,
                    0,
                    canvasRef.current.width,
                    canvasRef.current.height,
                  );
                }
              }}
            >
              Clear Page
            </button>
            <button type="button" onClick={() => setDrawingMode('pointer')}>
              Pointer
            </button>
            <select onChange={handlePageChange} value={currentPage}>
              {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map(
                (page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                ),
              )}
            </select>
            <div>
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage >= numPages!}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

PdfViewer.propTypes = {
  pdfUrl: PropTypes.string.isRequired,
};

export default PdfViewer;
