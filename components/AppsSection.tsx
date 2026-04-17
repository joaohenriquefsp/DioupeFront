"use client"

import { motion } from "framer-motion"
import { APPS } from "@/lib/constants"
import AppCard from "./AppCard"

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
      style={{ background: "var(--bg-surface)" }}
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
          <motion.p
            variants={item}
            className="text-xs font-medium uppercase tracking-widest mb-10 sm:mb-14 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Disponível agora
          </motion.p>

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
