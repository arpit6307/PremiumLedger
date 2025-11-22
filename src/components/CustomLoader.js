// src/components/CustomLoader.js

import React from 'react';
import { ShieldLockFill } from 'react-bootstrap-icons';

export default function CustomLoader() {
  return (
    <div className="custom-loader-overlay">
      <div className="loader-content">
        <div className="shield-container mb-3">
          <ShieldLockFill size={40} className="shield-icon" />
        </div>
        <div className="loading-text-container">
          <span className="loading-text">Zenith Console Initializing...</span>
        </div>
        <div className="loading-bar-custom">
          <div className="loading-bar-fill"></div>
        </div>
        <small className="text-muted mt-2">Accessing Secure Network (v1.0)</small>
      </div>
    </div>
  );
}