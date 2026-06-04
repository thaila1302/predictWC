import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import FirebaseSetupNotice from './components/FirebaseSetupNotice';
import { firebaseConfigured } from './firebase';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {firebaseConfigured ? (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    ) : (
      <FirebaseSetupNotice />
    )}
  </React.StrictMode>
);
