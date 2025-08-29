import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { PermissionProvider } from './context/PermissionContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <TenantProvider>
        <PermissionProvider>
          <App />
        </PermissionProvider>
      </TenantProvider>
    </AuthProvider>
  </BrowserRouter>
);


// ✅ Register service worker here
serviceWorkerRegistration.register();