"use client"

import { motion } from "framer-motion"
import { APPS } from "@/lib/constants"
import AppCard from "./AppCard"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
}

export default function AppsSection() {
  return (
    <section
      id="apps"
      className="w-full py-20 sm:py-28"
      style={{ background: "var(--bg-surface)", scrollMarginTop: "80px" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1024px",
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
          {/* Header com gato */}
          <motion.div
            variants={item}
            className="flex flex-col items-center mb-12 sm:mb-16"
          >
            <div className="relative flex flex-col items-center">
              {/* Gato deitado em cima do título */}
              <div style={{ width: 150, height: 150, marginBottom: -47, zIndex: 1 }}>
                <DotLottieReact src="/Cat.lottie" loop autoplay />
              </div>

              {/* Label pill */}
              <div
                className="inline-flex items-center gap-2 mb-4"
                style={{
                  background: "rgba(14,165,233,0.08)",
                  border: "var(--border-width) solid rgba(14,165,233,0.18)",
                  borderRadius: "999px",
                  padding: "var(--badge-padding)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Disponível agora
                </span>
              </div>

              <h2
                className="font-bold text-center mb-3"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2,
                }}
              >
                Baixe e use{" "}
                <span style={{ color: "var(--accent-bright)" }}>gratuitamente</span>
              </h2>

              <p
                className="text-center"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)",
                  maxWidth: 420,
                  lineHeight: 1.65,
                }}
              >
                Apps que eu construí pra resolver meus próprios problemas — e agora são seus também.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {APPS.map((app) => (
              <motion.div
                key={app.id}
                variants={item}
                style={{
                  width: "100%",
                  maxWidth: "480px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
                className="lg:max-w-none"
              >
                <AppCard {...app} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
