"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createPrivateRoom } from "@/lib/colyseus"

const MAPS = [
  { id: "praca-cine", name: "Praça Cine Roxy", preview: "/assets/maps/praca-cine.png" },
]

export default function CreateRoomPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [selectedMap, setSelectedMap] = useState("praca-cine")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    const name = nickname.trim() || "Player"
    setLoading(true)
    setError("")
    try {
      const room = await createPrivateRoom(name, selectedMap)
      // Salva room no sessionStorage para a página de sala acessar
      sessionStorage.setItem("colyseusRoom", JSON.stringify({
        roomId: room.roomId,
        sessionId: room.sessionId,
        nickname: name,
        isHost: true,
      }))
      router.push(`/room/${room.roomId}?nickname=${encodeURIComponent(name)}`)
    } catch (e) {
      setError("Servidor offline. Verifique se o servidor está rodando.")
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 480 }}
      >
        <a href="/lobby" style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "monospace", textDecoration: "none" }}>
          ← voltar
        </a>

        <h1 style={{
          fontSize: 28, fontWeight: 900, color: "var(--text-primary)",
          fontFamily: "monospace", textTransform: "uppercase",
          letterSpacing: "0.06em", margin: "20px 0 8px",
        }}>
          Criar Sala Privada
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 32 }}>
          2 jogadores · Você será o host
        </p>

        {/* Nickname */}
        <div style={{ marginBottom: 20 }}>
          <Label>Seu apelido</Label>
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0, 16))}
            placeholder="Ex: Destroyer2000"
          />
        </div>

        {/* Mapa */}
        <div style={{ marginBottom: 28 }}>
          <Label>Mapa</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MAPS.map(map => (
              <button
                key={map.id}
                onClick={() => setSelectedMap(map.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: selectedMap === map.id
                    ? "1px solid rgba(14,165,233,0.6)"
                    : "1px solid #1a1a1a",
                  background: selectedMap === map.id
                    ? "rgba(14,165,233,0.08)"
                    : "#0e0e0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <img
                  src={map.preview}
                  style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }}
                  alt={map.name}
                />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedMap === map.id ? "var(--accent-bright)" : "var(--text-primary)" }}>
                    {map.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
                    Plataformas · Praça urbana
                  </div>
                </div>
                {selectedMap === map.id && (
                  <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)" }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: 12, color: "#ef4444", fontFamily: "monospace",
          }}>
            {error}
          </div>
        )}

        <motion.button
          onClick={handleCreate}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          style={{
            width: "100%", padding: "14px 0",
            background: loading ? "rgba(14,165,233,0.05)" : "rgba(14,165,233,0.12)",
            border: "1px solid rgba(14,165,233,0.4)",
            borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
            color: loading ? "var(--text-muted)" : "var(--accent-bright)",
            fontSize: 14, fontWeight: 700, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}
        >
          {loading ? "Criando sala..." : "▶ Criar Sala"}
        </motion.button>
      </motion.div>
    </main>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px",
        background: "rgba(5,7,15,0.6)",
        border: "1px solid #1a1a1a",
        borderRadius: 10, color: "var(--text-primary)",
        fontSize: 14, outline: "none", fontFamily: "inherit",
        boxSizing: "border-box",
      }}
      onFocus={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}
      onBlur={e => e.currentTarget.style.borderColor = "#1a1a1a"}
    />
  )
}
