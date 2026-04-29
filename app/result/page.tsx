"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getCharacter } from "@/game/config/characters"

function ResultView() {
  const params = useSearchParams()
  const router = useRouter()
  const winner = params.get("winner") ?? "Ninguém"
  const characterId = params.get("character") ?? ""
  const char = getCharacter(characterId)

  const colorHex = char ? `#${char.color.toString(16).padStart(6, "0")}` : "var(--accent-bright)"

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colorHex}12 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 480 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div
            style={{
              fontSize: 64,
              marginBottom: 16,
              filter: "drop-shadow(0 0 20px rgba(255,200,0,0.4))",
            }}
          >
            🏆
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 12,
            }}
          >
            Vencedor
          </p>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              fontWeight: 700,
              color: colorHex,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            {winner}
          </h1>

          {char && (
            <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 40 }}>
              Jogando como{" "}
              <span style={{ color: colorHex, fontWeight: 600 }}>{char.name}</span>
            </p>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <motion.button
              whileHover={{ borderColor: "rgba(14,165,233,0.5)", boxShadow: "0 0 20px rgba(14,165,233,0.1)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/lobby")}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "1px solid rgba(14,165,233,0.3)",
                background: "rgba(14,165,233,0.1)",
                color: "var(--accent-bright)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ▶ Jogar novamente
            </motion.button>

            <motion.button
              whileHover={{ borderColor: "rgba(14,165,233,0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/")}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "1px solid var(--border-glass)",
                background: "var(--bg-glass)",
                backdropFilter: "blur(20px)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultView />
    </Suspense>
  )
}
