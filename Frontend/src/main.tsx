import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { ENV } from './config/env';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* O GoogleOAuthProvider garante que qualquer tela possa ter o botão do Google */}
    <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);