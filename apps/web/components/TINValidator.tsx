
import React, { useState, useCallback, useMemo } from 'react';

interface TINValidatorProps {
  value: string;
  onChange: (tin: string) => void;
  label?: string;
  placeholder?: string;
}

const NRS_TIN_REGEX = /^\d{11}$/;

const formatTIN = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) return digits;
  return `${digits.slice(0, 10)}-${digits[10]}`;
};

const validateTIN = (tin: string): { valid: boolean; message: string } => {
  const raw = tin.replace(/\D/g, '');
  if (raw.length === 0) return { valid: false, message: '' };
  if (raw.length < 11) return { valid: false, message: `TIN must be 11 digits (${raw.length}/11)` };
  if (!NRS_TIN_REGEX.test(raw)) return { valid: false, message: 'Invalid TIN format' };
  if (/^0{11}$/.test(raw)) return { valid: false, message: 'TIN cannot be all zeros' };
  if (/^1{11}$/.test(raw)) return { valid: false, message: 'TIN cannot be all ones' };
  return { valid: true, message: 'Valid NRS TIN' };
};

const TINValidator: React.FC<TINValidatorProps> = React.memo(({ value, onChange, label = 'TIN (Tax Identification Number)', placeholder = '0000000000-0' }) => {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const rawDigits = value.replace(/\D/g, '');
  const formatted = formatTIN(rawDigits);
  const validation = useMemo(() => validateTIN(value), [value]);
  const showFeedback = touched || rawDigits.length > 0;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(raw);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setTouched(true);
  }, []);

  const borderColor = !showFeedback
    ? 'border-slate-200'
    : validation.valid
      ? 'border-green-500 ring-1 ring-green-500'
      : rawDigits.length === 11
        ? 'border-red-500 ring-1 ring-red-500'
        : 'border-slate-200';

  const iconColor = !showFeedback
    ? 'text-slate-400'
    : validation.valid
      ? 'text-green-500'
      : rawDigits.length === 11
        ? 'text-red-500'
        : 'text-slate-400';

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {label}
      </label>

      <div className="relative group">
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${iconColor}`}>
          {showFeedback && validation.valid ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : showFeedback && rawDigits.length === 11 && !validation.valid ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={formatTIN(rawDigits)}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-10 py-2.5 bg-white border ${borderColor} rounded-lg text-slate-800 text-sm font-mono placeholder:text-slate-300 focus:outline-none transition-all duration-200 shadow-sm`}
        />
        {rawDigits.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
            title="Clear TIN"
            aria-label="Clear TIN"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showFeedback && validation.message && (
        <p className={`text-[10px] font-bold uppercase tracking-wide ${validation.valid ? 'text-green-600' : 'text-red-500'}`}>
          {validation.message}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-1">
        {[...Array(11)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i < rawDigits.length
                ? validation.valid
                  ? 'bg-green-500'
                  : 'bg-slate-400'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

export default TINValidator;
