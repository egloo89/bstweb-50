"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface ProcessStep {
  number: string
  title: string
  description: string
}

interface ProcessAutoScrollProps {
  steps: ProcessStep[]
}

const SCROLL_SPEED = 0.4

export function ProcessAutoScroll({ steps }: ProcessAutoScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return

    const container = containerRef.current
    if (!container) return

    let animationFrameId: number | null = null
    let scrollPosition = 0
    let singleSetWidth = 0
    let isHovering = false
    let isUserScrolling = false
    let resumeTimeout: NodeJS.Timeout | null = null
    let isRunning = false

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (prefersReducedMotion.matches) {
      return
    }

    const cancelResumeTimeout = () => {
      if (resumeTimeout) {
        clearTimeout(resumeTimeout)
        resumeTimeout = null
      }
    }

    const autoScroll = () => {
      if (!container || !isRunning) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
        return
      }

      if (!isHovering && !isUserScrolling && singleSetWidth > 0) {
        scrollPosition += SCROLL_SPEED
        if (scrollPosition >= singleSetWidth) {
          scrollPosition = scrollPosition - singleSetWidth
        }
        container.scrollLeft = scrollPosition
      }

      animationFrameId = requestAnimationFrame(autoScroll)
    }

    const startScrolling = () => {
      if (isRunning) return
      
      if (!container) return
      
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      
      if (scrollWidth <= clientWidth || scrollWidth === 0) {
        return
      }

      if (singleSetWidth === 0) {
        singleSetWidth = scrollWidth / 2
        scrollPosition = 0
      }

      isRunning = true
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(autoScroll)
      }
    }

    const handleMouseEnter = () => {
      isHovering = true
    }

    const handleMouseLeave = () => {
      isHovering = false
    }

    const handleScroll = () => {
      if (container) {
        scrollPosition = container.scrollLeft
        isUserScrolling = true
        cancelResumeTimeout()
        resumeTimeout = setTimeout(() => {
          isUserScrolling = false
        }, 1500)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      } else {
        startScrolling()
      }
    }

    // 초기화 함수
    const initialize = () => {
      if (!container) return

      const checkAndStart = () => {
        if (!container) return

        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth

        if (scrollWidth > clientWidth && scrollWidth > 0) {
          container.addEventListener("mouseenter", handleMouseEnter)
          container.addEventListener("mouseleave", handleMouseLeave)
          container.addEventListener("scroll", handleScroll)
          document.addEventListener("visibilitychange", handleVisibilityChange)

          singleSetWidth = scrollWidth / 2
          scrollPosition = 0

          // 여러 번 시도하여 확실히 시작
          setTimeout(() => startScrolling(), 500)
          setTimeout(() => startScrolling(), 1000)
          setTimeout(() => startScrolling(), 2000)
        } else {
          // 재시도
          setTimeout(checkAndStart, 300)
        }
      }

      // 여러 시점에서 시도
      setTimeout(checkAndStart, 500)
      setTimeout(checkAndStart, 1500)
      setTimeout(checkAndStart, 3000)
    }

    // IntersectionObserver로 섹션이 보일 때 시작
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              startScrolling()
            }, 500)
          } else {
            isRunning = false
            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId)
              animationFrameId = null
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    if (container) {
      observer.observe(container)
    }

    initialize()

    return () => {
      isRunning = false
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      cancelResumeTimeout()
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
        container.removeEventListener("scroll", handleScroll)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      observer.disconnect()
    }
  }, [isMounted, steps.length])

  return (
    <div
      ref={containerRef}
      className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 pt-8"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      {[0, 1].map((iteration) => (
        <div key={iteration} className="flex gap-6" style={{ display: "flex", gap: "1.5rem" }}>
          {steps.map((step, index) => (
            <motion.div
              key={`${iteration}-${index}`}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-[320px] md:w-[380px] bg-zinc-900/50 border border-white/10 p-8 rounded-xl relative"
              style={{
                marginTop: "2rem",
                flexShrink: 0,
                width: "320px",
                minWidth: "320px",
              }}
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
