"use client"

import { motion } from "framer-motion"
import { Smartphone, Monitor, Video } from "lucide-react"

const steps = [
  { icon: Smartphone, label: "Instale o DioupeCam no celular", step: "01" },
  { icon: Monitor,    label: "Instale o DioupeCam Desktop no PC", step: "02" },
  { icon: Video,      label: "Conecte e use como webcam", step: "03" },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
}

export default function HowItWorks() {
  return (
    <section
      className="w-full py-20 sm:py-28"
      style={{ background: "var(--bg-base)" }}
    >
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
          <motion.p
            variants={item}
            className="text-xs font-medium uppercase tracking-widest mb-8 sm:mb-10 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Como funciona
          </motion.p>

          <motion.div
            variants={item}
            style={{
              width: "100%",
              background: "var(--bg-glass)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--border-glass)",
              borderRadius: "20px",
              padding: "clamp(1.5rem, 4vw, 2.5rem)",
            }}
          >
            <motion.div
              variants={container}
              className="flex flex-col sm:flex-row items-stretch gap-8 sm:gap-0"
            >
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.step} className="flex flex-col items-center flex-1 text-center">
                    <motion.div
                      variants={item}
                      className="flex flex-col items-center text-center w-full"
                    >
                      <div
                        className="w-14 h-14 flex items-center justify-center rounded-2xl mb-4"
                        style={{
                          background: "rgba(14,165,233,0.08)",
                          border: "1px solid rgba(14,165,233,0.15)",
                        }}
                      >
                        <Icon size={22} style={{ color: "var(--accent-bright)" }} />
                      </div>
                      <span
                        className="text-xs font-medium mb-1"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {s.step}
                      </span>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {s.label}
                      </p>
                    </motion.div>

                    {i < steps.length - 1 && (
                      <div
                        className="block sm:hidden w-px mt-6"
                        style={{ height: "24px", background: "var(--border-glass)" }}
                      />
                    )}
                  </div>
                )
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
