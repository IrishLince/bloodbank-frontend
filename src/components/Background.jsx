import React from 'react'
import cover from '../assets/cover.png'

const Background = ({ children }) => {
  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ 
        backgroundImage: `url(${cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="w-full p-4 sm:p-6 md:p-0">
        <div>
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Background