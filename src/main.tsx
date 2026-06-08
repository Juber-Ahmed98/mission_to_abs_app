import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import './index.css';
import { installChunkErrorRecovery } from './lib/appRecovery';

// Reload to a fresh build if a lazy chunk goes missing after a deploy, rather
// than dead-ending the UI. (Boot-time failures are caught in index.html.)
installChunkErrorRecovery();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
