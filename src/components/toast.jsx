import React from 'react';

const Toast = ({ message, type, onClose }) => {
  return (
    <div className={`custom-toast ${type}`}>
      <span className="toast-icon">{type === 'success' ? '✅' : '❌'}</span>
      <span className="toast-message">{message}</span>
      <button className="close-btn" onClick={onClose}></button>
    </div>
  );
};

export default Toast;
