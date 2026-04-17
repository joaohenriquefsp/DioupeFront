"use client"

import { motion } from "framer-motion"
import { Camera, Monitor, Check, Download } from "lucide-react"

interface AppCardProps {
  title: string
  platform: string
  icon: "camera" | "monitor"
  description: string
  features: string[]
  downloadLabel: string
  downloadUrl: string
  info: string
}

const icons = { camera: Camera, monitor: Monitor }

export default function AppCard({
  title,
  platform,
  icon,
  description,
  features,
  downloadLabel,
  downloadUrl,
  info,
}: AppCardProps) {
  const Icon = icons[icon]

  return (
    <motion.div
      whileHover={{ scale: 1.012, transition: { duration: 0.2 } }}
      className="flex flex-col h-full w-full"
      style={{
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border-glass)",
        borderRadius: "20px",
        padding: "clamp(1.5rem, 4vw, 2.5rem)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--border-hover)"
        el.style.boxShadow = "0 0 48px rgba(14,165,233,0.08)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--border-glass)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Icon + badge */}
      <div className="flex items-start justify-between mb-6">
        <div
          className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
          style={{
            background: "rgba(14,165,233,0.1)",
            border: "1px solid rgba(14,165,233,0.2)",
          }}
        >
          <Icon size={20} style={{ color: "var(--accent-bright)" }} />
        </div>
        <span
          className="text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wider"
          style={{
            background: "rgba(14,165,233,0.1)",
            border: "1px solid rgba(14,165,233,0.2)",
            color: "var(--accent-bright)",
          }}
        >
          {platform}
        </span>
      </div>

      <h3
        className="font-semibold mb-3"
        style={{ color: "var(--text-primary)", fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)" }}
      >
        {title}
      </h3>

      <p
        className="leading-relaxed mb-6"
        style={{ color: "var(--text-secondary)", fontSize: "clamp(0.875rem, 1.5vw, 1rem)" }}
      >
        {description}
      </p>

      <ul className="flex flex-col gap-2.5 mb-8 flex-1">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-3">
            <Check size={15} className="shrink-0 mt-0.5" style={{ color: "var(--accent-primary)" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)" }}>
              {feat}
            </span>
          </li>
        ))}
      </ul>

      <motion.a
        href={downloadUrl}
        download
        className="flex items-center justify-center gap-2 w-full rounded-xl font-medium mb-3"
        style={{
          background: "var(--accent-primary)",
          color: "#fff",
          padding: "13px 24px",
          fontSize: "clamp(0.85rem, 1.5vw, 0.95rem)",
        }}
        whileHover={{ boxShadow: "0 0 28px rgba(14,165,233,0.45)" }}
      >
        <Download size={16} />
        {downloadLabel}
      </motion.a>

      <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
        {info}
      </p>
    </motion.div>
  )
}
