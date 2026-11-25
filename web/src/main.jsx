import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import './base.css';
import './components/components.css';
import App from './App.jsx';
import { StoreProvider } from './store/StoreProvider.jsx';
import DevStateLabel from './components/DevStateLabel.jsx';
import { devState } from './lib/devState.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
      {/* Dev only: «وضع تجربة، ما ينحفظ شي» while a ?state= test is open (removed from the production build). */}
      {import.meta.env.DEV && devState() && <DevStateLabel />}
    </StoreProvider>
  </StrictMode>,
);
