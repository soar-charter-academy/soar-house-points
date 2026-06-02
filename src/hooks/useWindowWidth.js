import { useState, useEffect } from 'react'

export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    function handle() { setWidth(window.innerWidth) }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  return width
}