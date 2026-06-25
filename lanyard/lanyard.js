import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const container = document.getElementById('lanyard-canvas')
if (!container) throw new Error('no #lanyard-canvas')

const W = container.clientWidth
const H = container.clientHeight

const scene = new THREE.Scene()
scene.background = null

const camera = new THREE.PerspectiveCamera(20, W / H, 0.1, 100)
camera.position.set(0, 2, 30)

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(W, H)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
container.appendChild(renderer.domElement)

const ambient = new THREE.AmbientLight(0xffffff, 2.5)
scene.add(ambient)
const dir1 = new THREE.DirectionalLight(0xffffff, 3)
dir1.position.set(5, 10, 5)
scene.add(dir1)
const dir2 = new THREE.DirectionalLight(0xffffff, 1.5)
dir2.position.set(-5, -5, 5)
scene.add(dir2)

const anchor = new THREE.Vector3(0, 12, 0)
const ropeLen = 10.5
const cardHangOffset = 2.8
const connectPos = new THREE.Vector3(0, anchor.y - ropeLen, 0)
const vel = new THREE.Vector3(0, 0, 0)
const cardScale = 4.0

let cardGroup = null
const loader = new GLTFLoader()
loader.load('lanyard/card.glb', (gltf) => {
  const model = gltf.scene
  cardGroup = new THREE.Group()
  cardGroup.scale.set(cardScale, cardScale, cardScale)
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone()
      if (child.material.map) {
        const texLoader = new THREE.TextureLoader()
        texLoader.load('lanyard/profile.png', (tex) => {
          const baseImg = child.material.map.image
          const iw = baseImg.width
          const ih = baseImg.height
          const canvas = document.createElement('canvas')
          canvas.width = iw
          canvas.height = ih
          const ctx = canvas.getContext('2d')
          ctx.drawImage(baseImg, 0, 0, iw, ih)
          const rw = iw * 0.5
          const rh = ih * 0.755
          const s = Math.max(rw / tex.image.width, rh / tex.image.height)
          const dw = tex.image.width * s
          const dh = tex.image.height * s
          const dx = (rw - dw) / 2
          const dy = (rh - dh) / 2
          ctx.save()
          ctx.beginPath()
          ctx.rect(0, 0, rw, rh)
          ctx.clip()
          ctx.drawImage(tex.image, dx, dy, dw, dh)
          ctx.restore()
          const composite = new THREE.CanvasTexture(canvas)
          composite.colorSpace = THREE.SRGBColorSpace
          composite.anisotropy = 16
          composite.needsUpdate = true
          child.material.map = composite
          child.material.needsUpdate = true
          child.material.roughness = 0.9
          child.material.metalness = 0.8
          child.material.clearcoat = 1
          child.material.clearcoatRoughness = 0.15
        })
      }
    }
  })
  cardGroup.add(model)
  scene.add(cardGroup)
})

const tubeRadius = 0.08
const tubeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.1 })
let tubeMesh = null

const dragging = { active: false }
const pointerWorld = new THREE.Vector3()

renderer.domElement.style.touchAction = 'none'
renderer.domElement.addEventListener('pointerdown', (e) => {
  dragging.active = true
  renderer.domElement.setPointerCapture(e.pointerId)
})
renderer.domElement.addEventListener('pointermove', (e) => {
  if (dragging.active) {
    const rect = renderer.domElement.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    pointerWorld.set(x, y, 0.5).unproject(camera)
    const dir = new THREE.Vector3().copy(pointerWorld).sub(camera.position).normalize()
    pointerWorld.add(dir.multiplyScalar(camera.position.length()))
  }
})
renderer.domElement.addEventListener('pointerup', () => {
  dragging.active = false
})

function resize() {
  const w = container.clientWidth
  const h = container.clientHeight
  if (w > 0 && h > 0) {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
}
window.addEventListener('resize', resize)
const ro = new ResizeObserver(resize)
ro.observe(container)
setTimeout(resize, 100)

const upVec = new THREE.Vector3(0, 1, 0)
const tmpQuat = new THREE.Quaternion()
const p1 = new THREE.Vector3()
const p2 = new THREE.Vector3()
const p3 = new THREE.Vector3()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(0.016, 0.05)
  if (dragging.active) {
    connectPos.lerp(pointerWorld, 0.12)
    vel.set(0, 0, 0)
  } else {
    vel.y += -10 * dt
    vel.multiplyScalar(0.995)
    connectPos.add(vel.clone().multiplyScalar(dt))
    const toAnchor = new THREE.Vector3().copy(anchor).sub(connectPos)
    const dist = toAnchor.length()
    if (dist > ropeLen) {
      toAnchor.normalize()
      connectPos.copy(anchor.clone().sub(toAnchor.multiplyScalar(ropeLen)))
      const nv = vel.dot(toAnchor)
      if (nv > 0) vel.sub(toAnchor.clone().multiplyScalar(nv))
    }
  }
  if (cardGroup) {
    const dirFromAnchor = new THREE.Vector3().copy(anchor).sub(connectPos).normalize()
    cardGroup.position.copy(connectPos).sub(dirFromAnchor.clone().multiplyScalar(cardHangOffset))
    tmpQuat.setFromUnitVectors(upVec, dirFromAnchor)
    cardGroup.quaternion.slerp(tmpQuat, 0.15)
  }

  const cp = connectPos
  const midY = (anchor.y + cp.y) / 2
  const midX = (anchor.x + cp.x) / 2 + 0.15
  const midZ = (anchor.z + cp.z) / 2 + 0.1
  p1.set(anchor.x, anchor.y, anchor.z)
  p2.set(midX, midY, midZ)
  p3.set(cp.x, cp.y, cp.z)
  const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)
  const newGeo = new THREE.TubeGeometry(curve, 16, tubeRadius, 6, false)
  if (tubeMesh) {
    tubeMesh.geometry.dispose()
    tubeMesh.geometry = newGeo
  } else {
    tubeMesh = new THREE.Mesh(newGeo, tubeMat)
    scene.add(tubeMesh)
  }

  renderer.render(scene, camera)
}
animate()
