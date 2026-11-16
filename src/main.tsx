import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './utils/i18n';
import { HeritageSitesProvider } from './utils/heritageSitesContext';

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <HeritageSitesProvider>
      <App />
    </HeritageSitesProvider>
  </LanguageProvider>
);
