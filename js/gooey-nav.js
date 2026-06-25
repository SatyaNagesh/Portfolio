/* ========================================
   GooeyNav — Vanilla JS (ported from React Bits)
   ======================================== */

function initGooeyNav(container, options = {}) {
  const config = {
    animationTime: 600,
    particleCount: 15,
    particleDistances: [90, 10],
    particleR: 100,
    timeVariance: 300,
    colors: [1, 2, 3, 1, 2, 3, 1, 4],
    onActiveChange: null,
    ...options
  }

  const ul = container.querySelector('ul')
  if (!ul) return

  const wrap = document.createElement('div')
  wrap.className = 'gooey-nav-wrap'
  ul.parentNode.insertBefore(wrap, ul)
  wrap.appendChild(ul)

  const nav = document.createElement('div')
  nav.className = 'gooey-nav'
  ul.parentNode.insertBefore(nav, ul)
  nav.appendChild(ul)

  const filterEl = document.createElement('span')
  filterEl.className = 'effect filter'
  wrap.appendChild(filterEl)

  const textEl = document.createElement('span')
  textEl.className = 'effect text'
  wrap.appendChild(textEl)

  const noise = (n = 1) => n / 2 - Math.random() * n

  const getXY = (distance, pointIndex, totalPoints) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180)
    return [distance * Math.cos(angle), distance * Math.sin(angle)]
  }

  const createParticle = (i, t, d, r) => {
    const rotate = noise(r / 10)
    return {
      start: getXY(d[0], config.particleCount - i, config.particleCount),
      end: getXY(d[1] + noise(7), config.particleCount - i, config.particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    }
  }

  const makeParticles = (element) => {
    const d = config.particleDistances
    const r = config.particleR
    const bubbleTime = config.animationTime * 2 + config.timeVariance
    element.style.setProperty('--time', `${bubbleTime}ms`)

    for (let i = 0; i < config.particleCount; i++) {
      const t = config.animationTime * 2 + noise(config.timeVariance * 2)
      const p = createParticle(i, t, d, r)
      element.classList.remove('active')

      setTimeout(() => {
        const particle = document.createElement('span')
        const point = document.createElement('span')
        particle.classList.add('particle')
        particle.style.setProperty('--start-x', `${p.start[0]}px`)
        particle.style.setProperty('--start-y', `${p.start[1]}px`)
        particle.style.setProperty('--end-x', `${p.end[0]}px`)
        particle.style.setProperty('--end-y', `${p.end[1]}px`)
        particle.style.setProperty('--time', `${p.time}ms`)
        particle.style.setProperty('--scale', `${p.scale}`)
        particle.style.setProperty('--particle-color', `var(--color-${p.color}, white)`)
        particle.style.setProperty('--rotate', `${p.rotate}deg`)

        point.classList.add('point')
        particle.appendChild(point)
        element.appendChild(particle)
        requestAnimationFrame(() => {
          element.classList.add('active')
        })
        setTimeout(() => {
          try {
            element.removeChild(particle)
          } catch (_) {}
        }, t)
      }, 30)
    }
  }

  const updateEffectPosition = (element) => {
    const wrapRect = wrap.getBoundingClientRect()
    const pos = element.getBoundingClientRect()

    const styles = {
      left: `${pos.x - wrapRect.x}px`,
      top: `${pos.y - wrapRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`
    }
    Object.assign(filterEl.style, styles)
    Object.assign(textEl.style, styles)
    textEl.innerText = element.innerText
  }

  const items = ul.querySelectorAll('li')

  const setActive = (index) => {
    items.forEach((li, i) => {
      li.classList.toggle('active', i === index)
    })

    const activeLi = items[index]
    if (activeLi) {
      updateEffectPosition(activeLi)

      const particles = filterEl.querySelectorAll('.particle')
      particles.forEach(p => filterEl.removeChild(p))

      textEl.classList.remove('active')
      void textEl.offsetWidth
      textEl.classList.add('active')

      makeParticles(filterEl)
    }

    if (config.onActiveChange) config.onActiveChange(index)
  }

  items.forEach((li, index) => {
    li.addEventListener('click', (e) => {
      const a = li.querySelector('a')
      if (a && a.getAttribute('href')?.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(a.getAttribute('href'))
        if (target) target.scrollIntoView({ behavior: 'smooth' })
      }
      setActive(index)
    })
  })

  const initialActive = ul.querySelector('.active') || ul.querySelector('li')
  if (initialActive) {
    const idx = Array.from(items).indexOf(initialActive)
    if (idx >= 0) {
      updateEffectPosition(initialActive)
      textEl.classList.add('active')
    }
  }

  const ro = new ResizeObserver(() => {
    const active = ul.querySelector('li.active')
    if (active) updateEffectPosition(active)
  })
  ro.observe(wrap)

  wrap._gooeySetActive = setActive
  wrap._gooeyUpdatePosition = () => {
    const active = ul.querySelector('li.active')
    if (active) updateEffectPosition(active)
  }

  return wrap
}
