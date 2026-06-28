/**
 * NRS Integration Panel Component
 */

import React, { useState } from 'react';
import { useNrsApi } from '../hooks/useNrsApi';
import { useRev360 } from '../hooks/useRev360';

interface NrsIntegrationPanelProps {
  invoice?: any;
  onClose?: () => void;
}

export const NrsIntegrationPanel: React.FC<NrsIntegrationPanelProps> = ({ invoice, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tin' | 'submit' | 'qr' | 'status'>('tin');
  const [tin, setTin] = useState('');
  const [tinValidation, setTinValidation] = useState<any>(null);
  const [qrCode, setQrCode] = useState<any>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const { validateTin, submitInvoice, getQrCode, checkStatus, loading, error } = useNrsApi();
  const { authenticated, checkCompliance } = useRev360();

  const handleValidateTin = async () => {
    if (!tin || tin.length !== 11) {
      alert('Please enter a valid 11-digit TIN');
      return;
    }
    const result = await validateTin(tin);
    setTinValidation(result);
  };

  const handleSubmit = async () => {
    if (!invoice) return;
    const result = await submitInvoice(invoice);
    setSubmissionResult(result);
  };

  const handleGenerateQR = async () => {
    if (!invoice?.id) return;
    const result = await getQrCode(invoice.id);
    setQrCode(result);
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">NRS Integration</h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        )}
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${authenticated ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <span className="text-sm text-slate-400">
          {authenticated ? 'Connected to Rev360' : 'Not connected to Rev360'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['tin', 'submit', 'qr', 'status'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'tin' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">TIN Validation</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="Enter 11-digit TIN"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                maxLength={11}
              />
              <button
                onClick={handleValidateTin}
                disabled={loading || tin.length !== 11}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Validating...' : 'Validate'}
              </button>
            </div>
            {tinValidation && (
              <div className={`p-4 rounded-lg ${tinValidation.valid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                <p className="font-semibold">{tinValidation.valid ? '✓ Valid TIN' : '✗ Invalid TIN'}</p>
                {tinValidation.businessName && <p className="text-sm text-slate-400">{tinValidation.businessName}</p>}
                {tinValidation.message && <p className="text-sm text-slate-400">{tinValidation.message}</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Submit Invoice to NRS</h3>
            <p className="text-sm text-slate-400">
              Submit your invoice to the Nigeria Revenue Service for e-invoicing compliance.
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading || !invoice}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit to NRS'}
            </button>
            {submissionResult && (
              <div className={`p-4 rounded-lg ${submissionResult.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                <p className="font-semibold">{submissionResult.success ? '✓ Submitted' : '✗ Failed'}</p>
                {submissionResult.nrsInvoiceId && <p className="text-sm text-slate-400">NRS ID: {submissionResult.nrsInvoiceId}</p>}
                {submissionResult.message && <p className="text-sm text-slate-400">{submissionResult.message}</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generate QR Code</h3>
            <p className="text-sm text-slate-400">
              Generate a QR code for invoice verification and payment.
            </p>
            <button
              onClick={handleGenerateQR}
              disabled={loading || !invoice}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
            {qrCode && (
              <div className="text-center">
                <img src={qrCode.qrCodeUrl} alt="QR Code" className="mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Scan to verify invoice</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Check Invoice Status</h3>
            <p className="text-sm text-slate-400">
              Check the status of a submitted invoice.
            </p>
            <button
              onClick={() => invoice?.id && checkStatus(invoice.id)}
              disabled={loading || !invoice}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
