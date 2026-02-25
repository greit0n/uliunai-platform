import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'

/**
 * Main App component wrapping the application with routing.
 * 
 * @description Sets up the React Router BrowserRouter with the base path
 * and renders the application routes. This is the root component of the application.
 * 
 * @returns {JSX.Element} The root app component with routing
 */
function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App