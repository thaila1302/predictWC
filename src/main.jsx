import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import FirebaseSetupNotice from './components/FirebaseSetupNotice';
import { firebaseConfigured } from './firebase';
import { UnitProvider } from './context/UnitContext';
import UnitAccessRedirect from './components/UnitAccessRedirect';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {firebaseConfigured ? (
      <BrowserRouter>
        <UnitAccessRedirect>
          <UnitProvider>
            <App />
          </UnitProvider>
        </UnitAccessRedirect>
      </BrowserRouter>
    ) : (
      <FirebaseSetupNotice />
    )}
  </React.StrictMode>
);
