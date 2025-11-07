"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface ProcessStep {
  number: string
  title: string
  description: string
}

interface ProcessAutoScrollProps {
  steps: ProcessStep[]
}

const SCROLL_SPEED = 0.4 // 픽셀/프레임 - 현재 속도의 0.8배

export function ProcessAutoScroll({ steps }: ProcessAutoScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (prefersReducedMotion.matches) {
      return
    }

    if (container.scrollWidth <= container.clientWidth) {
      return
    }

    let animationFrameId: number | null = null
    let scrollPosition = container.scrollLeft
    const singleSetWidth = container.scrollWidth / 2
    let isHovering = false
    let isUserScrolling = false
    let resumeTimeout: NodeJS.Timeout | null = null

    const cancelResumeTimeout = () => {
      if (resumeTimeout) {
        clearTimeout(resumeTimeout)
        resumeTimeout = null
      }
    }

    const handleMouseEnter = () => {
      isHovering = true
    }

    const handleMouseLeave = () => {
      isHovering = false
    }

    const handleScroll = () => {
      scrollPosition = container.scrollLeft
      isUserScrolling = true
      cancelResumeTimeout()
      resumeTimeout = setTimeout(() => {
        isUserScrolling = false
      }, 1500)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      } else if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(autoScroll)
      }
    }

    const autoScroll = () => {
      if (!isHovering && !isUserScrolling) {
        scrollPosition += SCROLL_SPEED
        if (scrollPosition >= singleSetWidth) {
          scrollPosition -= singleSetWidth
        }
        container.scrollLeft = scrollPosition
      }

      animationFrameId = requestAnimationFrame(autoScroll)
    }

    container.addEventListener("mouseenter", handleMouseEnter)
    container.addEventListener("mouseleave", handleMouseLeave)
    container.addEventListener("scroll", handleScroll)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    animationFrameId = requestAnimationFrame(autoScroll)

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      } else if (!event.matches && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(autoScroll)
      }
    }

    prefersReducedMotion.addEventListener("change", handleReducedMotionChange)

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      cancelResumeTimeout()
      container.removeEventListener("mouseenter", handleMouseEnter)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.removeEventListener("scroll", handleScroll)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      prefersReducedMotion.removeEventListener("change", handleReducedMotionChange)
    }
  }, [steps.length])

  return (
    <div
      ref={containerRef}
      className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 pt-8"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
    >
      {[0, 1].map((iteration) => (
        <div key={iteration} className="flex gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={`${iteration}-${index}`}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-[320px] md:w-[380px] bg-zinc-900/50 border border-white/10 p-8 rounded-xl relative"
              style={{ marginTop: "2rem" }}
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-black font-bold">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-4 mt-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  )
}

