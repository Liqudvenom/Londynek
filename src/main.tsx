import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource-variable/newsreader';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/ui.css';
import './components/london/london.css';
import { router } from './router';
import { SavedProvider } from './context/SavedContext';
import { ToastProvider } from './context/ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <SavedProvider>
        <RouterProvider router={router} />
      </SavedProvider>
    </ToastProvider>
  </StrictMode>,
);
