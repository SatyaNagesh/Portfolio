import { createRoot } from 'react-dom/client'
import PixelTrail from './PixelTrail'
import './PixelTrail.css'

<div style={{ height: '500px', position: 'relative', overflow: 'hidden'}}>
    <PixelTrail
      gridSize={50}
      trailSize={0.1}
      maxAge={250}
      interpolate={5}
      color="#b1b0b5"
      gooeyFilter={{ id: "custom-goo-filter", strength: 2 }}
      gooeyEnabled
      gooStrength={2}
    />
  </div>
)
