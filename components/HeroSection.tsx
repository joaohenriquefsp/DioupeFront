"use client"

import { motion } from "framer-motion"

const t = (delay = 0) =>
  ({ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay }) as const

export default function HeroSection() {
  return (
    <section
      className="relative w-full flex flex-col items-center justify-center min-h-screen text-center overflow-hidden"
      style={{ padding: "80px clamp(1rem, 5vw, 2rem) 0" }}
    >
      {/* Blobs */}
      <div
        className="absolute top-0 left-0 w-72 h-72 sm:w-[500px] sm:h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
          filter: "blur(100px)",
          transform: "translate(-40%, -40%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-72 h-72 sm:w-[500px] sm:h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
          filter: "blur(100px)",
          transform: "translate(40%, 40%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "768px",
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border-glass)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}
          />
          <span
            className="text-xs font-medium uppercase tracking-widest whitespace-nowrap"
            style={{ color: "var(--text-secondary)" }}
          >
            Softwares by João Henrique
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.1)}
          className="font-bold leading-tight mb-5 sm:mb-6"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            fontSize: "clamp(2.2rem, 7.5vw, 5rem)",
            width: "100%",
          }}
        >
          Ferramentas que eu uso.
          <br />
          Agora disponíveis pra{" "}
          <span style={{ color: "var(--accent-bright)" }}>você.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.2)}
          className="mb-8 sm:mb-10"
          style={{
            color: "var(--text-secondary)",
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            lineHeight: 1.7,
            maxWidth: "480px",
            width: "100%",
          }}
        >
          Apps construídos para resolver problemas{" "}
          <span style={{ color: "var(--accent-bright)" }}>reais</span> —
          direto ao ponto, sem frescura.
        </motion.p>

        {/* CTA */}
        <motion.a
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.3)}
          href="#apps"
          className="inline-flex items-center gap-3 rounded-full font-medium"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border-glass)",
            color: "var(--text-primary)",
            padding: "14px 36px",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
          whileHover={{
            borderColor: "rgba(14,165,233,0.4)",
            boxShadow: "0 0 32px rgba(14,165,233,0.12)",
          }}
        >
          ↓ Ver apps
        </motion.a>
      </div>
    </section>
  )
}
