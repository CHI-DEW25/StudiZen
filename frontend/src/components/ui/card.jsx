import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Apple-ish “liquid glass” Card primitives
 * - High transparency + strong blur
 * - Thin highlight border + specular sheen
 * - Subtle inner shadow + soft drop shadow
 *
 * Notes:
 * - Assumes your app sets `.dark` / `.light` on a parent (as your CSS does).
 * - Uses only Tailwind classes (no extra CSS files needed).
 */

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Layout
      "relative overflow-hidden rounded-2xl",

      // True glass: blur what's behind + keep fill very transparent
      "backdrop-blur-2xl [-webkit-backdrop-filter:blur(24px)]",

      // Very transparent base fill (keep it subtle; your page bg should provide color)
      "bg-white/[0.06] dark:bg-white/[0.05]",

      // Borders: faint outer + faint inner (reads like iOS glass edge)
      "border border-white/20 dark:border-white/10",
      "ring-1 ring-black/5 dark:ring-white/5",

      // Depth: soft shadow + slight inner shadow (helps edges pop without opacity)
      "shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.35)]",
      "shadow-inner shadow-white/5",

      // Specular highlight (top-left sheen)
      "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
      "before:bg-[radial-gradient(120%_80%_at_18%_8%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.18)_35%,transparent_70%)]",
      "before:opacity-60 dark:before:opacity-35",

      // Subtle bottom vignette (adds curvature / depth like liquid glass)
      "after:pointer-events-none after:absolute after:inset-0 after:content-['']",
      "after:bg-[radial-gradient(140%_110%_at_50%_120%,rgba(0,0,0,0.18)_0%,transparent_55%)]",
      "after:opacity-20 dark:after:opacity-35",

      // Keep token-based text colors
      "text-card-foreground",

      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }