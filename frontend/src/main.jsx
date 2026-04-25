import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { unregisterServiceWorkers } from './utils/unregisterSW.js';

// Unregister service workers in development to prevent cached SW issues
unregisterServiceWorkers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
