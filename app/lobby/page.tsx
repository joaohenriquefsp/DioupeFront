"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import RosterSelect from "@/components/roster/RosterSelect"
import { checkServerOnline, findRoomByCode } from "@/lib/colyseus"

const t = (delay = 0) =>
  ({ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay }) as const

export default function LobbyPage() {
  const router = useRouter()
  const [selectedChar, setSelectedChar] = useState("dioupe")
  const [nickname, setNickname] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [tab, setTab] = useState<"play" | "join">("play")
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkServerOnline().then(setServerOnline)
  }, [])

  const handlePlay = () => {
    const name = nickname.trim() || "Player"
    const params = new URLSearchParams({ character: selectedChar, nickname: name })
    router.push(`/game?${params.toString()}`)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setJoinError("")
    const name = nickname.trim() || "Player"
    const realRoomId = await findRoomByCode(joinCode.trim())
    if (!realRoomId) {
      setJoinError("Sala não encontrada. Verifique o código.")
      return
    }
    router.push(`/room/${realRoomId}?nickname=${encodeURIComponent(name)}`)
  }

  const handleCreateRoom = () => {
    const name = nickname.trim() || "Player"
    router.push(`/room/create?nickname=${encodeURIComponent(name)}`)
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Back link */}
      <motion.a
        href="/"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(0)}
        style={{
          alignSelf: "flex-start",
          color: "var(--text-muted)",
          fontSize: 13,
          fontFamily: "monospace",
          marginBottom: 32,
          textDecoration: "none",
          letterSpacing: "0.05em",
        }}
      >
        ← dioupe
      </motion.a>

      <div style={{ width: "100%", maxWidth: 860, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.05)}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              backdropFilter: "blur(20px)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 500,
              }}
            >
              Battle Royale 2D
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            dioupe<span style={{ color: "var(--accent-primary)" }}>·</span>
            <span style={{ color: "var(--accent-bright)" }}>battle</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 10 }}>
            Até 10 jogadores · Pixel art · Habilidades únicas
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
          className="lobby-grid"
        >
          {/* Left: roster */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.1)}
          >
            <RosterSelect selected={selectedChar} onSelect={setSelectedChar} />
          </motion.div>

          {/* Right: actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.15)}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Nickname */}
            <div
              style={{
                background: "var(--bg-glass)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-glass)",
                borderRadius: 16,
                padding: "20px 20px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 10,
                }}
              >
                Seu apelido
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                placeholder="Ex: Destroyer2000"
                maxLength={16}
                style={{
                  width: "100%",
                  background: "rgba(5,7,15,0.6)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(14,165,233,0.12)")
                }
              />
            </div>

            {/* Tabs */}
            <div
              style={{
                background: "var(--bg-glass)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-glass)",
                borderRadius: 16,
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {(["play", "join"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border:
                        tab === t
                          ? "1px solid rgba(14,165,233,0.4)"
                          : "1px solid transparent",
                      background:
                        tab === t ? "rgba(14,165,233,0.1)" : "transparent",
                      color:
                        tab === t ? "var(--accent-bright)" : "var(--text-muted)",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {t === "play" ? "Jogar" : "Entrar com código"}
                  </button>
                ))}
              </div>

              {/* Status do servidor */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "6px 10px", background: "rgba(5,7,15,0.4)", borderRadius: 6, border: "1px solid #1a1a1a" }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: serverOnline === null ? "#888" : serverOnline ? "#22c55e" : "#ef4444",
                  boxShadow: serverOnline ? "0 0 6px #22c55e" : "none",
                }} />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Servidor: {serverOnline === null ? "verificando..." : serverOnline ? "online" : "offline"}
                </span>
              </div>

              {tab === "play" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <ActionButton onClick={handlePlay} accent>
                    ▶ Jogar Solo
                  </ActionButton>
                  <ActionButton onClick={handleCreateRoom} disabled={!serverOnline}>
                    {serverOnline ? "🔒 Criar Sala Privada" : "🔒 Sala Privada (servidor offline)"}
                  </ActionButton>
                  <ActionButton onClick={handlePlay} disabled>
                    Sala Pública (em breve)
                  </ActionButton>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.slice(0, 26)); setJoinError("") }}
                    placeholder="CÓDIGO DA SALA"
                    style={{
                      width: "100%",
                      background: "rgba(5,7,15,0.6)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textAlign: "center",
                      outline: "none",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                      textTransform: "uppercase",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(14,165,233,0.12)")}
                  />
                  {joinError && (
                    <span style={{ color: "#f87171", fontSize: 12, textAlign: "center" }}>
                      {joinError}
                    </span>
                  )}
                  <ActionButton onClick={handleJoin} accent disabled={!serverOnline || !joinCode.trim()}>
                    {serverOnline ? "Entrar na Sala" : "Servidor offline"}
                  </ActionButton>
                </div>
              )}
            </div>

            {/* Controls */}
            <div
              style={{
                background: "var(--bg-glass)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-glass)",
                borderRadius: 16,
                padding: "16px 20px",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 10,
                }}
              >
                Controles
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "6px 12px",
                  fontSize: 12,
                }}
              >
                {[
                  ["A / ←", "Mover esquerda"],
                  ["D / →", "Mover direita"],
                  ["W / ↑ / Espaço", "Pular (duplo pulo)"],
                  ["J", "Ataque básico"],
                  ["K", "Golpe forte / área"],
                  ["L", "Especial"],
                ].map(([key, action]) => (
                  <React.Fragment key={key}>
                    <kbd
                      style={{
                        background: "rgba(14,165,233,0.1)",
                        border: "1px solid rgba(14,165,233,0.2)",
                        borderRadius: 5,
                        padding: "2px 7px",
                        color: "var(--accent-bright)",
                        fontFamily: "monospace",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      {key}
                    </kbd>
                    <span style={{ color: "var(--text-secondary)" }}>{action}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .lobby-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  )
}

function ActionButton({
  children,
  onClick,
  accent,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  accent?: boolean
  disabled?: boolean
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { borderColor: "rgba(14,165,233,0.5)", boxShadow: "0 0 20px rgba(14,165,233,0.1)" }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      style={{
        width: "100%",
        padding: "12px 0",
        borderRadius: 10,
        border: accent && !disabled
          ? "1px solid rgba(14,165,233,0.4)"
          : "1px solid var(--border-glass)",
        background:
          accent && !disabled ? "rgba(14,165,233,0.12)" : "rgba(5,7,15,0.4)",
        color: disabled
          ? "var(--text-muted)"
          : accent
          ? "var(--accent-bright)"
          : "var(--text-secondary)",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </motion.button>
  )
}
