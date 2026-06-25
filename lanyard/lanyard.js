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
const cardHangOffset = 1.0
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

const segs = 33
const bandPositions = new Float32Array(segs * 3)
const bandGeo = new THREE.BufferGeometry()
bandGeo.setAttribute('position', new THREE.BufferAttribute(bandPositions, 3))
const bandMat = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6 })
const bandLine = new THREE.Line(bandGeo, bandMat)
scene.add(bandLine)

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
  const positions = bandLine.geometry.attributes.position.array
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1)
    const c1x = (connectPos.x - anchor.x) * 0.3 + 0.15
    const c1y = (connectPos.y - anchor.y) * 0.3
    const c2x = (connectPos.x - anchor.x) * 0.7 - 0.1
    const c2y = (connectPos.y - anchor.y) * 0.7
    const tt = t * t
    const tp = 1 - t
    positions[i * 3] = tp * tp * t * anchor.x + 3 * tp * t * t * (anchor.x + c1x) + 3 * tp * tt * (anchor.x + c2x) + tt * t * connectPos.x
    positions[i * 3 + 1] = tp * tp * t * anchor.y + 3 * tp * t * t * (anchor.y + c1y) + 3 * tp * tt * (anchor.y + c2y) + tt * t * connectPos.y
    positions[i * 3 + 2] = 0
  }
  bandLine.geometry.attributes.position.needsUpdate = true
  renderer.render(scene, camera)
}
animate()
