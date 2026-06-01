import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DeviceProvider } from './device/DeviceProvider';
import { useThemeStore } from './store/useThemeStore';
import './theme/index.css';

// Apply the persisted theme before first paint.
document.documentElement.dataset.theme = useThemeStore.getState().theme;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DeviceProvider>
        <App />
      </DeviceProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
