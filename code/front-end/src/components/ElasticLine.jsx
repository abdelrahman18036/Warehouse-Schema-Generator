import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, animate } from "framer-motion";

import { useDimensions } from "./hooks/useDimensions";
import { useElasticLineEvents } from "./hooks/useElasticLineEvents";

/**
 * An interactive line that responds to mouse movement with elastic animation
 * @param {Object} props - Component props
 * @param {boolean} [props.isVertical=false] - Whether the line is vertical or horizontal
 * @param {number} [props.grabThreshold=5] - Distance threshold to grab the line
 * @param {number} [props.releaseThreshold=100] - Distance threshold to release the line
 * @param {number} [props.strokeWidth=1] - Width of the line stroke
 * @param {string} [props.className] - Additional CSS classes
 */
const ElasticLine = ({
  isVertical = false,
  grabThreshold = 5,
  releaseThreshold = 100,
  strokeWidth = 1,
  className,
}) => {
  const containerRef = useRef(null);
  const dimensions = useDimensions(containerRef);
  const pathRef = useRef(null);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  const clampedReleaseThreshold = Math.min(
    releaseThreshold,
    isVertical ? dimensions.width / 2 : dimensions.height / 2
  );

  const { isGrabbed, controlPoint } = useElasticLineEvents(
    containerRef,
    isVertical,
    grabThreshold,
    clampedReleaseThreshold
  );

  const x = useMotionValue(dimensions.width / 2);
  const y = useMotionValue(dimensions.height / 2);
  const pathLength = useMotionValue(0);

  useEffect(() => {
    if (!hasAnimatedIn && dimensions.width > 0 && dimensions.height > 0) {
      animate(pathLength, 1, {
        duration: 0.3,
        ease: "easeInOut",
        onComplete: () => setHasAnimatedIn(true),
      });
    }
    x.set(dimensions.width / 2);
    y.set(dimensions.height / 2);
  }, [dimensions, hasAnimatedIn, pathLength, x, y]);

  useEffect(() => {
    if (!isGrabbed && hasAnimatedIn) {
      animate(x, dimensions.width / 2, {
        type: "spring",
        stiffness: 400,
        damping: 5,
      });
      animate(y, dimensions.height / 2, {
        type: "spring",
        stiffness: 400,
        damping: 5,
      });
    }
  }, [isGrabbed, hasAnimatedIn, dimensions, x, y]);

  useAnimationFrame(() => {
    if (isGrabbed) {
      x.set(controlPoint.x);
      y.set(controlPoint.y);
    }

    const controlX = hasAnimatedIn ? x.get() : dimensions.width / 2;
    const controlY = hasAnimatedIn ? y.get() : dimensions.height / 2;

    if (pathRef.current) {
      pathRef.current.setAttribute(
        "d",
        isVertical
          ? `M${dimensions.width / 2} 0Q${controlX} ${controlY} ${dimensions.width / 2} ${dimensions.height}`
          : `M0 ${dimensions.height / 2}Q${controlX} ${controlY} ${dimensions.width} ${dimensions.height / 2}`
      );
    }
  });

  return (
    <svg
      ref={containerRef}
      className={`w-full h-full ${className || ""}`}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="none"
    >
      <motion.path
        ref={pathRef}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        initial={{ pathLength: 0 }}
        style={{ pathLength }}
        fill="none"
      />
    </svg>
  );
};

export default ElasticLine;