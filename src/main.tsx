import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LearnerProfileProvider } from './store/learnerProfile';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LearnerProfileProvider>
      <App />
    </LearnerProfileProvider>
  </StrictMode>,
);
