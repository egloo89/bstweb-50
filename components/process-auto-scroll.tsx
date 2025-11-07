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
    if (typeof window === 'undefined') return

    let animationFrameId: number | null = null
    let initTimeout: NodeJS.Timeout | null = null
    let retryTimeout: NodeJS.Timeout | null = null
    let retryCount = 0
    const MAX_RETRIES = 50

    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null
    
    if (prefersReducedMotion?.matches) {
      return
    }
    
    let scrollPosition = 0
    let singleSetWidth = 0
    let isHovering = false
    let isUserScrolling = false
    let resumeTimeout: NodeJS.Timeout | null = null
    let handleMouseEnter: (() => void) | null = null
    let handleMouseLeave: (() => void) | null = null
    let handleScroll: (() => void) | null = null
    let handleVisibilityChange: (() => void) | null = null
    let handleReducedMotionChange: ((event: MediaQueryListEvent) => void) | null = null
    let observer: IntersectionObserver | null = null

    const cancelResumeTimeout = () => {
      if (resumeTimeout) {
        clearTimeout(resumeTimeout)
        resumeTimeout = null
      }
    }

    const autoScroll = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
        return
      }

      if (!isHovering && !isUserScrolling && singleSetWidth > 0) {
        scrollPosition += SCROLL_SPEED
        if (scrollPosition >= singleSetWidth) {
          scrollPosition -= singleSetWidth
        }
        currentContainer.scrollLeft = scrollPosition
      }

      animationFrameId = requestAnimationFrame(autoScroll)
    }

    const startAutoScroll = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) return

      if (currentContainer.scrollWidth <= currentContainer.clientWidth || currentContainer.scrollWidth === 0) {
        return
      }

      if (singleSetWidth === 0) {
        scrollPosition = 0
        singleSetWidth = currentContainer.scrollWidth / 2
      }

      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(autoScroll)
      }
    }

    const initAutoScroll = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) {
        retryCount++
        if (retryCount < MAX_RETRIES) {
          retryTimeout = setTimeout(initAutoScroll, 200)
        }
        return
      }

      // 스크롤 컨테이너의 크기가 제대로 계산될 때까지 대기
      if (currentContainer.scrollWidth <= currentContainer.clientWidth || currentContainer.scrollWidth === 0) {
        retryCount++
        if (retryCount < MAX_RETRIES) {
          retryTimeout = setTimeout(initAutoScroll, 200)
        }
        return
      }

      scrollPosition = 0
      singleSetWidth = currentContainer.scrollWidth / 2

      handleMouseEnter = () => {
        isHovering = true
      }

      handleMouseLeave = () => {
        isHovering = false
      }

      handleScroll = () => {
        if (currentContainer) {
          scrollPosition = currentContainer.scrollLeft
          isUserScrolling = true
          cancelResumeTimeout()
          resumeTimeout = setTimeout(() => {
            isUserScrolling = false
          }, 1500)
        }
      }

      handleVisibilityChange = () => {
        if (document.hidden) {
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
            animationFrameId = null
          }
        } else {
          startAutoScroll()
        }
      }

      if (handleMouseEnter && handleMouseLeave && handleScroll && handleVisibilityChange) {
        currentContainer.addEventListener("mouseenter", handleMouseEnter)
        currentContainer.addEventListener("mouseleave", handleMouseLeave)
        currentContainer.addEventListener("scroll", handleScroll)
        document.addEventListener("visibilitychange", handleVisibilityChange)
      }

      // IntersectionObserver로 섹션이 보일 때 시작
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                startAutoScroll()
              }, 1000)
            } else {
              if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
              }
            }
          })
        },
        { threshold: 0.1 }
      )

      observer.observe(currentContainer)

      // 초기화 지연 (DOM이 완전히 렌더링될 때까지 대기)
      setTimeout(() => {
        startAutoScroll()
      }, 1200)

      if (prefersReducedMotion) {
        handleReducedMotionChange = (event: MediaQueryListEvent) => {
          if (event.matches && animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
            animationFrameId = null
          } else if (!event.matches) {
            startAutoScroll()
          }
        }
        prefersReducedMotion.addEventListener("change", handleReducedMotionChange)
      }
    }

    // DOM이 준비될 때까지 대기
    const startInit = () => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initAutoScroll, 500)
      } else {
        window.addEventListener('load', () => {
          setTimeout(initAutoScroll, 500)
        })
        initTimeout = setTimeout(initAutoScroll, 2000)
      }
    }

    startInit()

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      if (initTimeout) {
        clearTimeout(initTimeout)
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      cancelResumeTimeout()
      if (observer) {
        observer.disconnect()
      }
      const currentContainer = containerRef.current
      if (currentContainer && handleMouseEnter && handleMouseLeave && handleScroll && handleVisibilityChange) {
        currentContainer.removeEventListener("mouseenter", handleMouseEnter)
        currentContainer.removeEventListener("mouseleave", handleMouseLeave)
        currentContainer.removeEventListener("scroll", handleScroll)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
      if (handleReducedMotionChange && prefersReducedMotion) {
        prefersReducedMotion.removeEventListener("change", handleReducedMotionChange)
      }
    }
  }, [])

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

