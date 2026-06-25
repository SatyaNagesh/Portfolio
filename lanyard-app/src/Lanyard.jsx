import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, Float, Html } from '@react-three/drei'
import * as THREE from 'three'

const BLANK_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 }
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 }

export default function Lanyard({
  position = [0, 0, 30],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const m = window.innerWidth < 768
    setIsMobile(m)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <HangingCard frontImage={frontImage} backImage={backImage} imageFit={imageFit} isMobile={isMobile} />
        </Suspense>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  )
}

function HangingCard({ frontImage, backImage, imageFit, isMobile }) {
  const groupRef = useRef()
  const { nodes, materials } = useGLTF('./card.glb')
  const frontTex = useTexture(frontImage || BLANK_PIXEL)
  const backTex = useTexture(backImage || BLANK_PIXEL)
  const { viewport } = useThree()

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map
    if (!frontImage && !backImage) return baseMap
    const baseImg = baseMap.image
    const W = baseImg.width
    const H = baseImg.height
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return baseMap
    ctx.drawImage(baseImg, 0, 0, W, H)
    const drawFitted = (img, rect) => {
      const rx = rect.x * W
      const ry = rect.y * H
      const rw = rect.w * W
      const rh = rect.h * H
      const pick = imageFit === 'contain' ? Math.min : Math.max
      const scale = pick(rw / img.width, rh / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      const dx = rx + (rw - dw) / 2
      const dy = ry + (rh - dh) / 2
      ctx.save()
      ctx.beginPath()
      ctx.rect(rx, ry, rw, rh)
      ctx.clip()
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
    }
    if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT)
    if (backImage && backTex.image) drawFitted(backTex.image, BACK_UV_RECT)
    const composite = new THREE.CanvasTexture(canvas)
    composite.colorSpace = THREE.SRGBColorSpace
    composite.flipY = baseMap.flipY
    composite.anisotropy = 16
    composite.needsUpdate = true
    return composite
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map])

  const curveRef = useRef()
  const lanyardPoints = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(new THREE.Vector3(0, 2.8 - t * 2.5, t * 0.3))
    }
    return pts
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      groupRef.current.position.x = Math.sin(t * 0.6) * 1.2
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.08
      groupRef.current.rotation.x = Math.sin(t * 0.4 + 1) * 0.06
    }
    if (curveRef.current) {
      const positions = curveRef.current.geometry.attributes.position.array
      const len = positions.length / 3
      for (let i = 0; i < len; i++) {
        const t = i / (len - 1)
        const sway = Math.sin(state.clock.elapsedTime * 0.6 + t * 2) * 0.15 * t
        const baseX = lanyardPoints[Math.floor(t * (lanyardPoints.length - 1))]?.x || 0
        positions[i * 3] = baseX + sway
      }
      curveRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  const scale = isMobile ? 1.6 : 2.0

  return (
    <group position={[0, 0.5, 0]}>
      {/* Lanyard band */}
      <line ref={curveRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lanyardPoints.length}
            array={new Float32Array(lanyardPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#aaaaaa" linewidth={1} transparent opacity={0.6} />
      </line>

      {/* Card */}
      <Float
        ref={groupRef}
        speed={1.2}
        rotationIntensity={0.15}
        floatIntensity={0.3}
        position={[0, -2.2, 0.3]}
      >
        <group scale={scale}>
          <mesh geometry={nodes.card.geometry}>
            <meshPhysicalMaterial map={cardMap} map-anisotropy={16} clearcoat={isMobile ? 0 : 1} clearcoatRoughness={0.15} roughness={0.9} metalness={0.8} />
          </mesh>
          <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
          <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
        </group>
      </Float>
    </group>
  )
}
