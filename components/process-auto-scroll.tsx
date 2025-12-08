"use client"

import { motion } from "framer-motion"

interface ProcessStep {
  number: string
  title: string
  description: string
}

interface ProcessAutoScrollProps {
  steps: ProcessStep[]
}

export function ProcessAutoScroll({ steps }: ProcessAutoScrollProps) {

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto justify-items-center">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="w-full max-w-[380px] bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-xl relative"
          >
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-black font-bold text-sm md:text-base">
              {step.number}
            </div>
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 mt-2">{step.title}</h3>
            <p className="text-sm md:text-base lg:text-lg text-gray-400">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
