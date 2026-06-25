import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'

function Loader() {
  const { progress } = useProgress()
  if (progress < 100) {
    return <Html center><span style={{ color: '#888', fontFamily: 'monospace', fontSize: 12 }}>{Math.round(progress)}%</span></Html>
  }
  return null
}

export default function Lanyard() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 30, near: 0.1, far: 100 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x0a0a0a), 0)}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[0, 0, 5]} intensity={2} />
        <Suspense fallback={<Loader />}>
          <Card isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function Card({ isMobile }) {
  const tex = useTexture('./profile.png')
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1
    }
  })

  return (
    <group>
      <Html center>
        <div style={{
          background: '#111', color: '#0f0', fontFamily: 'monospace',
          fontSize: 11, padding: 12, borderRadius: 6, maxWidth: 300,
          lineHeight: 1.5, border: '1px solid #0f0'
        }}>
          <div>Three.js is running</div>
          <div>tex: {tex ? tex.image?.width + 'x' + tex.image?.height : 'null'}</div>
        </div>
      </Html>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={isMobile ? 1.5 : 2}>
        <planeGeometry args={[1, 1.5]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}
