import React from 'react';
import './ErrorState.css';

const ErrorState = ({
  title = "Couldn't load mods",
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" />
          <path
            d="M32 18v20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="32" cy="46" r="2.5" fill="currentColor" />
        </svg>
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="error-state-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
