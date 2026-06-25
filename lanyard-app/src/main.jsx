import React from 'react'
import ReactDOM from 'react-dom/client'
import Lanyard from './Lanyard'
import profile from './profile.png'
import './Lanyard.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Lanyard
    position={[0, 0, 30]}
    gravity={[0, -40, 0]}
    frontImage={profile}
  />
)
