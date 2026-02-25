import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Application entry point.
 * 
 * @description Initializes the React application by creating a root and rendering
 * the App component in StrictMode. Imports i18n configuration and global styles.
 * This is the first code that executes when the application loads.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
