import React from 'react';

// Basic modal structure - consider using a library like antd Modal or building a custom one
function ReportModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  // Basic inline styles for modal demonstration
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '30px',
    zIndex: 1000,
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <h2>Report Issue</h2>
        <p>This is the report modal content.</p>
        {/* Add form elements or other content here */}
        <button onClick={onClose} style={{ marginTop: '15px' }}>Close</button>
      </div>
    </>
  );
}

export default ReportModal;