"use client"

import { motion } from "framer-motion"
import { Smartphone, Monitor, Video, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Smartphone,
    label: "Instale o DioupeCam no celular",
    description: "Disponível para Android e iOS — rápido e leve.",
    step: "01",
  },
  {
    icon: Monitor,
    label: "Instale o DioupeCam Desktop no PC",
    description: "App nativo para Windows que recebe o vídeo.",
    step: "02",
  },
  {
    icon: Video,
    label: "Conecte e use como webcam",
    description: "Aparece como câmera virtual em qualquer app.",
    step: "03",
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export default function HowItWorks() {
  return (
    <section className="w-full py-20 sm:py-28" style={{ background: "var(--bg-base)" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "896px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "clamp(1rem, 5vw, 2rem)",
          paddingRight: "clamp(1rem, 5vw, 2rem)",
        }}
      >
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Header */}
          <motion.div variants={item} className="text-center mb-12 sm:mb-16">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest mb-4"
              style={{
                color: "var(--accent-primary)",
                background: "rgba(14,165,233,0.08)",
                border: "var(--border-width) solid rgba(14,165,233,0.18)",
                borderRadius: "999px",
                padding: "var(--badge-padding)",
                marginTop: "10px",
              }}
            >
              Como funciona
            </span>
            <h2
              className="font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Em 3 passos simples
            </h2>
          </motion.div>

          {/* Steps */}
          <motion.div
            variants={item}
            style={{
              background: "var(--bg-glass)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "var(--border-width) solid var(--border-glass)",
              borderRadius: "24px",
              padding: "clamp(2rem, 5vw, 3rem)",
            }}
          >
            <div className="flex flex-col sm:flex-row items-stretch gap-8 sm:gap-0">
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.step} className="flex sm:contents">
                    {/* Step */}
                    <div className="flex flex-col items-center flex-1 text-center px-2 sm:px-4">
                      {/* Step number */}
                      <div
                        className="text-xs font-bold rounded-full flex items-center justify-center"
                        style={{
                          color: "var(--accent-primary)",
                          background: "rgba(14,165,233,0.1)",
                          border: "var(--border-width) solid rgba(14,165,233,0.2)",
                          letterSpacing: "0.05em",
                          width: "40px",
                          height: "40px",
                          flexShrink: 0,
                          marginBottom: "10px",
                        }}
                      >
                        {s.step}
                      </div>

                      {/* Icon */}
                      <div
                        className="w-16 h-16 flex items-center justify-center rounded-2xl mb-5"
                        style={{
                          background: "rgba(14,165,233,0.08)",
                          border: "1px solid rgba(14,165,233,0.15)",
                        }}
                      >
                        <Icon size={26} style={{ color: "var(--accent-bright)" }} />
                      </div>

                      {/* Text */}
                      <p
                        className="font-semibold mb-2"
                        style={{ color: "var(--text-primary)", fontSize: "clamp(0.875rem, 1.5vw, 0.95rem)", lineHeight: 1.4 }}
                      >
                        {s.label}
                      </p>
                      <p
                        style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.6 }}
                      >
                        {s.description}
                      </p>
                    </div>

                    {/* Seta entre steps — desktop horizontal, mobile vertical */}
                    {i < steps.length - 1 && (
                      <>
                        {/* Desktop arrow */}
                        <div
                          className="hidden sm:flex items-center justify-center self-center"
                          style={{ color: "var(--border-hover)", flexShrink: 0 }}
                        >
                          <ArrowRight size={18} />
                        </div>
                        {/* Mobile divider */}
                        <div
                          className="flex sm:hidden justify-center"
                          style={{ color: "var(--border-hover)", margin: "-12px 0" }}
                        >
                          <ArrowRight size={16} style={{ transform: "rotate(90deg)" }} />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
