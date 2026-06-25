import { createRoot } from 'react-dom/client'
import PixelTrail from './PixelTrail'
import './PixelTrail.css'

createRoot(document.getElementById('root')).render(
  <PixelTrail
    gridSize={40}
    trailSize={0.25}
    maxAge={500}
    interpolate={1}
    color="#b1b0b5"
    gooeyFilter={{ id: 'custom-goo-filter', strength: 1 }}
  />
)
