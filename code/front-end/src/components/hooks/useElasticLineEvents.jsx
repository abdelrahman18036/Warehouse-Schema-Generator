import { useEffect, useState } from "react"
import { useDimensions } from "./useDimensions"
import { useMousePosition } from "./useMousePosition"

/**
 * Hook to create interactive elastic line effects
 * @param {React.RefObject} containerRef - Reference to the SVG container
 * @param {boolean} isVertical - Whether the elastic effect is vertical
 * @param {number} grabThreshold - Distance threshold to grab the line
 * @param {number} releaseThreshold - Distance threshold to release the line
 * @returns {{ isGrabbed: boolean, controlPoint: {x: number, y: number} }} State of the elastic line
 */
export function useElasticLineEvents(
  containerRef,
  isVertical,
  grabThreshold,
  releaseThreshold
) {
  const mousePosition = useMousePosition(containerRef)
  const dimensions = useDimensions(containerRef)
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [controlPoint, setControlPoint] = useState({
    x: dimensions.width / 2,
    y: dimensions.height / 2,
  })

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = dimensions
      const x = mousePosition.x
      const y = mousePosition.y

      // Check if mouse is outside container bounds
      const isOutsideBounds = x < 0 || x > width || y < 0 || y > height

      if (isOutsideBounds) {
        setIsGrabbed(false)
        return
      }

      let distance
      let newControlPoint

      if (isVertical) {
        const midX = width / 2
        distance = Math.abs(x - midX)
        newControlPoint = {
          x: midX + 2.2 * (x - midX),
          y: y,
        }
      } else {
        const midY = height / 2
        distance = Math.abs(y - midY)
        newControlPoint = {
          x: x,
          y: midY + 2.2 * (y - midY),
        }
      }

      setControlPoint(newControlPoint)

      if (!isGrabbed && distance < grabThreshold) {
        setIsGrabbed(true)
      } else if (isGrabbed && distance > releaseThreshold) {
        setIsGrabbed(false)
      }
    }
  }, [mousePosition, dimensions, isVertical, isGrabbed, grabThreshold, releaseThreshold])

  return { isGrabbed, controlPoint }
}