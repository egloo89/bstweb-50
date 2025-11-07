"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ProcessStep {
  number: string
  title: string
  description: string
}

interface ProcessAutoScrollProps {
  steps: ProcessStep[]
}

export function ProcessAutoScroll({ steps }: ProcessAutoScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    const container = containerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    checkScrollButtons()
    container.addEventListener("scroll", checkScrollButtons)
    window.addEventListener("resize", checkScrollButtons)

    return () => {
      container.removeEventListener("scroll", checkScrollButtons)
      window.removeEventListener("resize", checkScrollButtons)
    }
  }, [steps.length])

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current
    if (!container) return

    const cardWidth = 320 + 24 // 카드 너비 + gap
    const scrollAmount = cardWidth * 2 // 한 번에 2개씩 이동

    const currentScroll = container.scrollLeft
    const newScroll = direction === "left" 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount

    container.scrollTo({
      left: newScroll,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative">
      {/* 왼쪽 화살표 */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 rounded-full p-3 transition-all duration-200 shadow-lg"
          aria-label="이전 카드"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
      )}

      {/* 오른쪽 화살표 */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 rounded-full p-3 transition-all duration-200 shadow-lg"
          aria-label="다음 카드"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      )}

      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 pt-8 pl-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          overflowX: "auto",
          overflowY: "hidden",
          paddingLeft: "1rem",
        }}
      >
        {steps.map((step, index) => (
          <motion.div
            key={index}
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
    </div>
  )
}
