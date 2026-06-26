import { createRoot } from 'react-dom/client'
import PixelTrail from './PixelTrail'
import './PixelTrail.css'

createRoot(document.getElementById('root')).render(
  <div style={{ height: '500px', position: 'relative', overflow: 'hidden'}}>
    <PixelTrail
      gridSize={1000}
      trailSize={0.1}
      maxAge={400}
      interpolate={2.5}
      color="#b1b0b5"
      gooeyFilter={{ id: "custom-goo-filter", strength: 2 }}
      gooeyEnabled
      gooStrength={2}
    />
  </div>
)
