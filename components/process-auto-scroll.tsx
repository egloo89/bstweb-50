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

const SCROLL_SPEED = 0.4

export function ProcessAutoScroll({ steps }: ProcessAutoScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // 모든 window/document 접근을 useEffect 안에서만
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const container = containerRef.current
    if (!container) return

    let animationFrameId: number | null = null
    let scrollPosition = 0
    let singleSetWidth = 0
    let isHovering = false
    let isUserScrolling = false
    let resumeTimeout: NodeJS.Timeout | null = null
    let isActive = false

    // window 접근을 useEffect 안에서만
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
      if (!container || !isActive) {
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
      if (!container || isActive) return
      
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      
      if (scrollWidth <= clientWidth || scrollWidth === 0) {
        return
      }

      if (singleSetWidth === 0) {
        singleSetWidth = scrollWidth / 2
        scrollPosition = 0
      }

      isActive = true
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
        isActive = false
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      } else {
        startScrolling()
      }
    }

    // 초기화 함수 - 여러 시점에서 시도
    const initialize = () => {
      if (!container) return

      const tryStart = () => {
        if (!container) return

        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth

        if (scrollWidth > clientWidth && scrollWidth > 0) {
          singleSetWidth = scrollWidth / 2
          scrollPosition = 0
          startScrolling()
        }
      }

      // 즉시 시도
      tryStart()

      // 짧은 지연 후 시도
      setTimeout(tryStart, 100)
      setTimeout(tryStart, 300)
      setTimeout(tryStart, 500)
      setTimeout(tryStart, 1000)
      setTimeout(tryStart, 2000)
    }

    // 이벤트 리스너 등록
    container.addEventListener("mouseenter", handleMouseEnter)
    container.addEventListener("mouseleave", handleMouseLeave)
    container.addEventListener("scroll", handleScroll)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // IntersectionObserver로 섹션이 보일 때 시작
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              initialize()
            }, 300)
          } else {
            isActive = false
            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId)
              animationFrameId = null
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: "50px" }
    )

    observer.observe(container)

    // DOM이 준비된 후 초기화 - document 접근을 useEffect 안에서만
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(initialize, 500)
    } else {
      window.addEventListener('load', () => {
        setTimeout(initialize, 500)
      })
      setTimeout(initialize, 2000)
    }

    return () => {
      isActive = false
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
  }, [steps.length])

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
