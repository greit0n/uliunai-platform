import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import AmbientEffects from './components/feature/AmbientEffects'
import VantaFog from './components/feature/VantaFog'
import 'motion-icons-react/style.css'

/**
 * Main App component wrapping the application with routing.
 *
 * @description Sets up the React Router BrowserRouter with the base path
 * and renders the application routes. Includes Vanta fog background and
 * ambient ember particles for atmospheric presentation.
 *
 * @returns {JSX.Element} The root app component with routing
 */
function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <VantaFog style={{ position: 'fixed', zIndex: 0 }} />
      <AmbientEffects />
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App