import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'

const BLANK_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAA0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 }
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 }

function Loader() {
  const { progress } = useProgress()
  return <Html center><span style={{ color: '#888', fontFamily: 'monospace', fontSize: 12 }}>{Math.round(progress)}%</span></Html>
}

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
        camera={{ position, fov, near: 0.1, far: 100 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x0a0a0a), transparent ? 0 : 1)}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, 5]} intensity={0.5} />
        <Suspense fallback={<Loader />}>
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
  const bandRef = useRef()
  const cardRef = useRef()
  const dragging = useRef(false)

  const anchor = useMemo(() => new THREE.Vector3(0, 2.5, 0), [])
  const ropeLen = 2.2
  const pos = useRef(new THREE.Vector3(0.5, anchor.y - ropeLen, 0))
  const vel = useRef(new THREE.Vector3(0, 0, 0))

  const { nodes, materials } = useGLTF('./card.glb')
  const frontTex = useTexture(frontImage || BLANK_PIXEL)
  const backTex = useTexture(backImage || BLANK_PIXEL)

  const cardMap = useMemo(() => {
    try {
      const baseMap = materials.base?.map
      if (!baseMap) return null
      if (!frontImage && !backImage) return baseMap
      const baseImg = baseMap.image
      if (!baseImg) return baseMap
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
      if (frontImage && frontTex?.image) drawFitted(frontTex.image, FRONT_UV_RECT)
      if (backImage && backTex?.image) drawFitted(backTex.image, BACK_UV_RECT)
      const composite = new THREE.CanvasTexture(canvas)
      composite.colorSpace = THREE.SRGBColorSpace
      composite.flipY = baseMap.flipY
      composite.anisotropy = 16
      composite.needsUpdate = true
      return composite
    } catch {
      return materials.base?.map || null
    }
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials])

  const [hovered, hover] = useState(false)

  useEffect(() => {
    document.body.style.cursor = hovered ? (dragging.current ? 'grabbing' : 'grab') : 'auto'
  }, [hovered])

  const bandGeo = useMemo(() => {
    const pts = new Float32Array(33 * 3)
    for (let i = 0; i < 33; i++) {
      const t = i / 32
      pts[i * 3] = 0
      pts[i * 3 + 1] = anchor.y - t * ropeLen
      pts[i * 3 + 2] = 0
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    return geo
  }, [anchor, ropeLen])

  useFrame((state, delta) => {
    const p = pos.current
    const v = vel.current
    const dt = Math.min(delta, 0.05)

    if (dragging.current) {
      const pointer = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      const dir = new THREE.Vector3().copy(pointer).sub(state.camera.position).normalize()
      pointer.add(dir.multiplyScalar(state.camera.position.length()))
      p.lerp(pointer, 0.12)
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
      cardRef.current.lookAt(look)
    }

    if (bandRef.current) {
      const positions = bandRef.current.geometry.attributes.position.array
      const segs = positions.length / 3
      for (let i = 0; i < segs; i++) {
        const t = i / (segs - 1)
        const c1x = (p.x - anchor.x) * 0.3 + 0.15
        const c1y = (p.y - anchor.y) * 0.3
        const c2x = (p.x - anchor.x) * 0.7 - 0.1
        const c2y = (p.y - anchor.y) * 0.7
        const tt = t * t
        const tp = 1 - t
        positions[i * 3] = tp * tp * t * anchor.x + 3 * tp * t * t * (anchor.x + c1x) + 3 * tp * tt * (anchor.x + c2x) + tt * t * p.x
        positions[i * 3 + 1] = tp * tp * t * anchor.y + 3 * tp * t * t * (anchor.y + c1y) + 3 * tp * tt * (anchor.y + c2y) + tt * t * p.y
        positions[i * 3 + 2] = 0
      }
      bandRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  const sc = isMobile ? 1.6 : 2.25

  const cardGeo = nodes.card?.geometry
  const clipGeo = nodes.clip?.geometry
  const clampGeo = nodes.clamp?.geometry
  const metalMat = materials.metal

  if (!cardGeo) {
    return <Html center><span style={{ color: '#f44', fontFamily: 'monospace', fontSize: 12 }}>card.glb: no geometry</span></Html>
  }

  return (
    <>
      <line ref={bandRef} geometry={bandGeo}>
        <lineBasicMaterial color="#aaaaaa" transparent opacity={0.5} />
      </line>
      <group
        ref={cardRef}
        scale={sc}
        position={[0.5, anchor.y - ropeLen, 0]}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
        onPointerDown={(e) => {
          e.target.setPointerCapture(e.pointerId)
          dragging.current = true
        }}
        onPointerUp={(e) => {
          e.target.releasePointerCapture(e.pointerId)
          dragging.current = false
        }}
      >
        <mesh geometry={cardGeo}>
          <meshPhysicalMaterial
            map={cardMap}
            map-anisotropy={16}
            clearcoat={isMobile ? 0 : 1}
            clearcoatRoughness={0.15}
            roughness={0.9}
            metalness={0.8}
          />
        </mesh>
        {clipGeo && <mesh geometry={clipGeo} material={metalMat} material-roughness={0.3} />}
        {clampGeo && <mesh geometry={clampGeo} material={metalMat} />}
      </group>
    </>
  )
}
