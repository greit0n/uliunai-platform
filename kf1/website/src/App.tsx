import { useState, useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from './router'
import AmbientEffects from './components/feature/AmbientEffects'
import VantaFog from './components/feature/VantaFog'
import 'motion-icons-react/style.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function ScrollToTopButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-red-900/60 border border-red-800/40 backdrop-blur-sm text-white hover:bg-red-800/80 transition-all flex items-center justify-center shadow-lg cursor-pointer"
      aria-label="Scroll to top"
    >
      <i className="ri-arrow-up-line text-lg"></i>
    </button>
  )
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <ScrollToTop />
      <VantaFog style={{ position: 'fixed', zIndex: 0 }} />
      <AmbientEffects />
      <AppRoutes />
      <ScrollToTopButton />
    </BrowserRouter>
  )
}

export default App