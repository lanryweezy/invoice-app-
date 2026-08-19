import React, { useState, useEffect } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { LockIcon } from './Icons';

interface IdleLockScreenProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
}

export const IdleLockScreen: React.FC<IdleLockScreenProps> = ({ children, timeoutMinutes = 15 }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPin = localStorage.getItem('app_pin');
    if (!savedPin) {
      setIsSettingUp(true);
    }
  }, []);

  const onIdle = () => {
    if (localStorage.getItem('app_pin')) {
      setIsLocked(true);
    }
  };

  const { reset } = useIdleTimer({
    onIdle,
    timeout: timeoutMinutes * 60 * 1000,
    promptBeforeIdle: 0,
    events: ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove', 'visibilitychange'],
  });

  const handleSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    localStorage.setItem('app_pin', setupPin);
    setIsSettingUp(false);
    setError('');
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('app_pin');
    if (pin === savedPin) {
      setIsLocked(false);
      setPin('');
      setError('');
      reset();
    } else {
      setError('Incorrect PIN');
    }
  };

  if (!isLocked && !isSettingUp) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <LockIcon className="w-8 h-8 text-teal-600" />
        </div>
        
        {isSettingUp ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Set Security PIN</h2>
            <p className="text-slate-500 mb-6 text-sm">Create a PIN to protect your financial data when away.</p>
            <form onSubmit={handleSetupPin}>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                value={setupPin}
                onChange={(e) => {
                  setSetupPin(e.target.value);
                  setError('');
                }}
                className="w-full text-center text-3xl tracking-[1em] p-4 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="••••"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition-colors">
                Save PIN
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Locked</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter your PIN to resume.</p>
            <form onSubmit={handleUnlock}>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                className="w-full text-center text-3xl tracking-[1em] p-4 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="••••"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                Unlock
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
