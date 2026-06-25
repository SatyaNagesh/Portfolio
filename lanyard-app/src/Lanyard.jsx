import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

extend({ MeshLineGeometry, MeshLineMaterial })

const BLANK_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAA0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
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
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Band isMobile={isMobile} frontImage={frontImage} backImage={backImage} imageFit={imageFit} />
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

function Band({ isMobile = false, frontImage = null, backImage = null, imageFit = 'cover' }) {
  const band = useRef()
  const cardRef = useRef()
  const { nodes, materials } = useGLTF('./card.glb')
  const frontTex = useTexture(frontImage || BLANK_PIXEL)
  const backTex = useTexture(backImage || BLANK_PIXEL)

  const anchor = useMemo(() => new THREE.Vector3(0, 2.5, 0), [])
  const ropeLen = 2.2
  const pos = useRef(new THREE.Vector3(0.5, anchor.y - ropeLen, 0))
  const vel = useRef(new THREE.Vector3(0, 0, 0))
  const dragging = useRef(false)
  const pointerWorld = useRef(new THREE.Vector3())

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

  const [hovered, hover] = useState(false)

  useEffect(() => {
    document.body.style.cursor = hovered ? (dragging.current ? 'grabbing' : 'grab') : 'auto'
  }, [hovered])

  useFrame((state, delta) => {
    const p = pos.current
    const v = vel.current
    const dt = Math.min(delta, 0.05)

    if (dragging.current) {
      const target = pointerWorld.current.clone()
      p.lerp(target, 0.12)
      v.set(0, 0, 0)
    } else {
      v.y += -10 * dt
      v.multiplyScalar(0.995)
      p.add(v.clone().multiplyScalar(dt))
      const toAnchor = new THREE.Vector3().copy(anchor).sub(p)
      const dist = toAnchor.length()
      if (dist > ropeLen) {
        toAnchor.normalize()
        p.copy(anchor.clone().sub(toAnchor.multiplyScalar(ropeLen)))
        const nv = v.dot(toAnchor)
        if (nv > 0) v.sub(toAnchor.clone().multiplyScalar(nv))
      }
    }

    if (cardRef.current) {
      cardRef.current.position.copy(p)
      const look = new THREE.Vector3().copy(anchor).lerp(p, 0.3)
      cardRef.current.lookAt(look.x, look.y, look.z)
    }

    if (band.current) {
      const pts = []
      for (let i = 0; i <= 32; i++) {
        const t = i / 32
        const c1x = anchor.x + (p.x - anchor.x) * 0.3 + 0.3
        const c1y = anchor.y + (p.y - anchor.y) * 0.3 - 0.4
        const c1z = anchor.z + (p.z - anchor.z) * 0.3
        const c2x = anchor.x + (p.x - anchor.x) * 0.7 - 0.2
        const c2y = anchor.y + (p.y - anchor.y) * 0.7 - 0.2
        const c2z = anchor.z + (p.z - anchor.z) * 0.7
        const tt = t * t
        const tp = 1 - t
        pts.push(
          tp * tp * t * anchor.x + 3 * tp * t * t * c1x + 3 * tp * tt * c2x + tt * t * p.x,
          tp * tp * t * anchor.y + 3 * tp * t * t * c1y + 3 * tp * tt * c2y + tt * t * p.y,
          tp * tp * t * anchor.z + 3 * tp * t * t * c1z + 3 * tp * tt * c2z + tt * t * p.z,
        )
      }
      band.current.geometry.setPoints(pts)
    }
  })

  const sc = isMobile ? 1.6 : 2.25

  return (
    <>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial color="white" depthTest={false} resolution={[1000, 1000]} lineWidth={1.5} transparent opacity={0.5} />
      </mesh>
      <group
        ref={cardRef}
        scale={sc}
        position={[0.5, anchor.y - ropeLen, 0]}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
        onPointerDown={(e) => {
          e.target.setPointerCapture(e.pointerId)
          dragging.current = true
          pointerWorld.current.copy(e.point)
        }}
        onPointerMove={(e) => {
          if (dragging.current) pointerWorld.current.copy(e.point)
        }}
        onPointerUp={(e) => {
          e.target.releasePointerCapture(e.pointerId)
          dragging.current = false
        }}
      >
        <mesh geometry={nodes.card.geometry}>
          <meshPhysicalMaterial map={cardMap} map-anisotropy={16} clearcoat={isMobile ? 0 : 1} clearcoatRoughness={0.15} roughness={0.9} metalness={0.8} />
        </mesh>
        <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
        <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
      </group>
    </>
  )
}
