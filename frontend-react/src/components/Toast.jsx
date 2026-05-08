import React, { useState, useEffect } from 'react';
import './Toast.css';

/**
 * Toast notification component for displaying alerts, errors, and success messages
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {string} message - Message to display
 * @param {number} duration - How long to show (ms), 0 = permanent
 * @param {function} onClose - Callback when toast closes
 */
export function Toast({ type = 'info', message, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === 0) return; // Don't auto-close if duration is 0
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Toast container for managing multiple toasts
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  // Expose global toast functions
  React.useEffect(() => {
    window.showToast = (message, type = 'info', duration = 3000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      return id;
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
