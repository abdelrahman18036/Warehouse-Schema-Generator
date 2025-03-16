import { useEffect, useState } from "react"

/**
 * Hook to measure the dimensions of a DOM element
 * @param {React.RefObject} ref - The ref object attached to the element to measure
 * @returns {{width: number, height: number}} The dimensions of the element
 */
export function useDimensions(ref) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateDimensions = () => {
      if (ref && ref.current) {
        const { width, height } = ref.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => window.removeEventListener("resize", updateDimensions)
  }, [ref])

  return dimensions
}