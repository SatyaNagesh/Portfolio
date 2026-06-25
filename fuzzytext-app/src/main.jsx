import { createRoot } from 'react-dom/client'
import FuzzyText from './FuzzyText'

createRoot(document.getElementById('root')).render(
  <FuzzyText
    fontSize="clamp(4rem, 20vw, 14rem)"
    fontWeight={900}
    fontFamily="'JetBrains Mono', monospace"
    color="#ffffff"
    enableHover={true}
    baseIntensity={0.2}
    hoverIntensity={1.24}
    fuzzRange={30}
    fps={60}
    direction="both"
    clickEffect={true}
    glitchMode={true}
    glitchInterval={2500}
    glitchDuration={200}
  >
    404
  </FuzzyText>
)
