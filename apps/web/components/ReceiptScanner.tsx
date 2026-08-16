import React, { useState } from 'react';
import { useCamera } from '../hooks/useCamera';

interface ReceiptScannerProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onCapture, onClose }) => {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, capturePhoto } = useCamera();
  const [captured, setCaptured] = useState<string | null>(null);

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setCaptured(photo);
      stopCamera();
    }
  };

  const handleConfirm = () => {
    if (captured) {
      onCapture(captured);
    }
    onClose();
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800">
        <button onClick={onClose} className="text-white text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 rounded px-2 py-1">
          Cancel
        </button>
        <h2 className="text-white font-bold">Scan Receipt</h2>
        <div className="w-16" />
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center">
            <svg className="w-16 h-16 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-lg font-bold mb-2">Camera Access Required</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-2 bg-teal-600 text-white rounded-xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Try Again
            </button>
          </div>
        ) : captured ? (
          <img src={captured} alt="Captured receipt" className="w-full h-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[85%] h-[60%] border-2 border-white/50 rounded-xl" />
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-slate-800 flex justify-center gap-4">
        {captured ? (
          <>
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
              Use Photo
            </button>
          </>
        ) : (
          <button
            onClick={isStreaming ? handleCapture : startCamera}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            aria-label={isStreaming ? "Capture photo" : "Start camera"}
          >
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
