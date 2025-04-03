import React from 'react';
import ReactDOM from 'react-dom/client'; // Use createRoot for React 18+
import { App } from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store'; // Import configured store
import { Toaster } from 'react-hot-toast'; // Import Toaster
import './styles/global.css'; // Import global styles
// Import the supabase client to ensure it's initialized
import { supabase } from './lib/supabaseClient';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to!");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        {/* You might wrap <App /> with an AuthProvider context here later */}
        <App />
        <Toaster position="top-right" /> {/* Add Toaster for notifications */}
      </Router>
    </Provider>
  </React.StrictMode>
);
