"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX"

interface AdSenseAdProps {
  slot: string
  format?: "auto" | "rectangle" | "horizontal" | "vertical"
  responsive?: boolean
  className?: string
  style?: React.CSSProperties
  label?: string
}

export function AdSenseAd({
  slot,
  format = "auto",
  responsive = true,
  className,
  style,
  label = "광고",
}: AdSenseAdProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (e) {
      // ignore - adsense not loaded in dev
    }
  }, [])

  return (
    <div className={cn("w-full my-6", className)}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1 text-center">
        {label}
      </div>
      <ins
        className="adsbygoogle block bg-muted/40 rounded-md min-h-[90px]"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  )
}

export function AdBanner({ slot = "1111111111" }: { slot?: string }) {
  return (
    <AdSenseAd
      slot={slot}
      format="horizontal"
      className="mx-auto max-w-3xl"
      style={{ display: "block", minHeight: 90 }}
    />
  )
}

export function AdInArticle({ slot = "2222222222" }: { slot?: string }) {
  return (
    <AdSenseAd
      slot={slot}
      format="auto"
      className="my-8"
      style={{ display: "block", minHeight: 250 }}
    />
  )
}

export function AdSidebar({ slot = "3333333333" }: { slot?: string }) {
  return (
    <AdSenseAd
      slot={slot}
      format="rectangle"
      responsive={false}
      style={{ display: "inline-block", width: 300, height: 250 }}
      className="mx-auto"
    />
  )
}

export function AdFooter({ slot = "4444444444" }: { slot?: string }) {
  return (
    <AdSenseAd
      slot={slot}
      format="horizontal"
      className="mx-auto max-w-4xl"
      style={{ display: "block", minHeight: 90 }}
    />
  )
}
