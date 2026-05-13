"use client"

import { motion } from "framer-motion"
import { GitBranch, Mail, ArrowUpRight } from "lucide-react"

const links = [
  { label: "Apps", href: "#apps" },
  { label: "Como funciona", href: "#how" },
  { label: "Jogar", href: "/lobby" },
]

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="w-full"
      style={{ borderTop: "1px solid var(--border-glass)", marginTop: "40px" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1024px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "clamp(2.5rem, 5vw, 3.5rem) clamp(1rem, 5vw, 2rem)",
        }}
      >
        {/* Grid principal */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 mb-10"
        >
          {/* Col 1 — identidade */}
          <div className="flex flex-col gap-3">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              dioupe
              <span style={{ color: "var(--accent-primary)" }}>·</span>
            </span>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.7, maxWidth: 240 }}>
              Ferramentas que eu construí pra resolver meus próprios problemas. Gratuitas, direto ao ponto.
            </p>
          </div>

          {/* Col 2 — links rápidos */}
          <div className="flex flex-col gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Links
            </span>
            <nav className="flex flex-col gap-2">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 w-fit transition-colors duration-150"
                  style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-bright)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                >
                  <ArrowUpRight size={12} style={{ opacity: 0.6 }} />
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Col 3 — contato */}
          <div className="flex flex-col gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Contato
            </span>
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/joaohenriquefsp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 w-fit transition-colors duration-150"
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-bright)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                <GitBranch size={16} />
                joaohenriquefsp
              </a>
              <a
                href="mailto:joaohenriquefsp@gmail.com"
                className="flex items-center gap-2.5 w-fit transition-colors duration-150"
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-bright)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                <Mail size={16} />
                joaohenriquefsp@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Linha + copyright */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6"
          style={{ borderTop: "1px solid var(--border-glass)" }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            © {new Date().getFullYear()} dioupe · Feito por João Henrique
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            Todos os direitos reservados
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
