import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// En producción se silencian los mensajes informativos de consola (incluidos
// los de librerías). Los console.* propios ya se eliminan del bundle al compilar.
if (import.meta.env.PROD) {
  const silencio = () => {};
  console.log = silencio;
  console.info = silencio;
  console.debug = silencio;
  console.trace = silencio;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
