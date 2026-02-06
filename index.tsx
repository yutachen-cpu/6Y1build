import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/Toast';
import { ImagePreviewProvider } from './components/ImagePreview';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <ImagePreviewProvider>
        <App />
      </ImagePreviewProvider>
    </ToastProvider>
  </React.StrictMode>
);