import { useState } from 'react'

export const useModal = () => {
  const [isShown, setIsShown] = useState<boolean>(false)
  const toggle = () => setIsShown(!isShown)
  const show = () => setIsShown(true)
  const hide = () => setIsShown(true)
  return {
    isShown,
    toggle,
    show,
    hide,
  }
}
