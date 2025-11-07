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
  respectReducedMotion?: boolean // prefers-reduced-motion 설정을 존중할지 여부 (기본값: false)
}

const SCROLL_SPEED = 0.4

export function ProcessAutoScroll({ steps, respectReducedMotion = false }: ProcessAutoScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // 모든 window/document 접근을 useEffect 안에서만
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const container = containerRef.current
    if (!container) return

    // 환경 변수 체크: 프로덕션에서 자동 스크롤이 꺼지지 않도록 확인
    // 주의: process.env는 클라이언트 사이드에서 접근 가능하지만, 
    // Next.js에서는 빌드 타임에 인라인되므로 클라이언트 컴포넌트에서는 사용하지 않음
    // 환경 변수로 인한 자동 스크롤 비활성화는 없음

    let animationFrameId: number | null = null
    let scrollPosition = 0
    let singleSetWidth = 0
    let isHovering = false
    let isUserScrolling = false
    let resumeTimeout: NodeJS.Timeout | null = null
    let isActive = false

    // window 접근을 useEffect 안에서만
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    
    // respectReducedMotion 옵션이 true일 때만 모션 줄이기 설정을 존중
    // 기본값은 false이므로 프로덕션에서도 자동 스크롤이 작동함
    if (respectReducedMotion && prefersReducedMotion.matches) {
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
      
      // 스타일 확인: overflow-x-auto가 실제로 적용되어 있는지
      const computedStyle = window.getComputedStyle(container)
      const overflowX = computedStyle.overflowX
      
      if (overflowX !== 'auto' && overflowX !== 'scroll') {
        // 강제로 overflow-x: auto 적용
        container.style.overflowX = 'auto'
        container.style.overflowY = 'hidden'
      }
      
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      
      // 요소 총 너비 > 컨테이너 너비인지 확인
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

    // 초기화 함수 - 레이아웃 확정 후 시작
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

      // requestAnimationFrame으로 한 프레임 대기 (레이아웃 확정 후)
      const rafId = requestAnimationFrame(() => {
        // 추가로 약간의 지연을 두어 이미지/폰트 로딩 대기
        setTimeout(() => {
          tryStart()
          // 여러 시점에서 재시도 (이미지/폰트 로딩 완료 대기)
          setTimeout(tryStart, 200)
          setTimeout(tryStart, 500)
          setTimeout(tryStart, 1000)
        }, 100)
      })

      return rafId
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
            // 레이아웃 확정 후 시작
            const rafId = requestAnimationFrame(() => {
              setTimeout(() => {
                initialize()
              }, 100)
            })
            return () => cancelAnimationFrame(rafId)
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

    // DOM이 준비된 후 초기화 - 레이아웃 확정 후 시작
    let initRafId: number | null = null
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initRafId = initialize()
    } else {
      window.addEventListener('load', () => {
        initRafId = initialize()
      })
      // 폴백: load 이벤트가 이미 발생했을 수 있음
      setTimeout(() => {
        initRafId = initialize()
      }, 2000)
    }

    return () => {
      isActive = false
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      if (initRafId !== null) {
        cancelAnimationFrame(initRafId)
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
      className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 pt-8 whitespace-nowrap snap-x snap-mandatory"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        overflowX: "auto",
        overflowY: "hidden",
        overflow: "auto",
        width: "100%",
        maxWidth: "100%",
        whiteSpace: "nowrap",
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
