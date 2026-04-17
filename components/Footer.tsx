"use client"

import { motion } from "framer-motion"

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="w-full py-10 px-4 text-center"
      style={{ borderTop: "1px solid var(--border-glass)" }}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>dioupe · 2025</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Feito por João Henrique</p>
    </motion.footer>
  )
}
