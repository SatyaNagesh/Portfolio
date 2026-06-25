import React from 'react'
import ReactDOM from 'react-dom/client'
import Lanyard from './Lanyard'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Lanyard
    position={[0, 0, 30]}
    fov={20}
    frontImage="./profile.png"
  />
)
