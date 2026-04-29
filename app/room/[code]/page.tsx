"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Room } from "colyseus.js"
import { joinPrivateRoom, createPrivateRoom } from "@/lib/colyseus"
import { setActiveRoom } from "@/lib/gameRoom"
import { CHARACTERS } from "@/game/config/characters"

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`

interface PlayerInfo {
  id: string
  nickname: string
  characterId: string
  isHost: boolean
  ready: boolean
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomCode = params.code as string
  const nickname  = searchParams.get("nickname") ?? "Player"
  const mapId     = searchParams.get("map") ?? "praca-cine"
  const isNew     = roomCode === "new"

  const roomRef        = useRef<Room | null>(null)
  const navigatingRef  = useRef(false)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [mySessionId, setMySessionId] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [takenChars, setTakenChars] = useState<string[]>([])
  const [selectedChar, setSelectedChar] = useState("")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [connecting, setConnecting] = useState(true)
  const [hostError, setHostError] = useState("")

  useEffect(() => {
    let room: Room

    const connect = async () => {
      try {
        room = isNew
          ? await createPrivateRoom(nickname, mapId)
          : await joinPrivateRoom(roomCode, nickname)

        // Atualiza a URL com o roomId real (sem reload)
        if (isNew) {
          window.history.replaceState(null, "", `/room/${room.roomId}?nickname=${encodeURIComponent(nickname)}`)
        }
        roomRef.current = room
        setConnecting(false)

        room.onMessage("joined", (data: { sessionId: string; isHost: boolean }) => {
          setMySessionId(data.sessionId)
          setIsHost(data.isHost)
        })

        room.onMessage("characterTaken", () => {
          setError("Personagem já escolhido por outro jogador!")
          setTimeout(() => setError(""), 3000)
        })

        room.onMessage("error", (data: { message: string }) => {
          setHostError(data.message)
          setTimeout(() => setHostError(""), 3000)
        })

        room.onMessage("countdown", (data: { seconds: number }) => {
          setCountdown(data.seconds)
        })

        room.onMessage("gameStart", (data: { mapId: string }) => {
          // Preserva a conexão ao navegar para o jogo
          navigatingRef.current = true
          setActiveRoom(room)
          const char = selectedCharRef.current
          router.push(`/game?character=${char}&nickname=${encodeURIComponent(nickname)}&online=true`)
        })

        room.onMessage("newHost", (data: { id: string }) => {
          if (data.id === room.sessionId) setIsHost(true)
        })

        room.onStateChange(state => {
          const ps: PlayerInfo[] = []
          state.players.forEach((p: PlayerInfo) => {
            ps.push({ id: p.id, nickname: p.nickname, characterId: p.characterId, isHost: p.isHost, ready: p.ready })
          })
          setPlayers(ps)

          const taken: string[] = []
          state.takenCharacters.forEach((c: string) => taken.push(c))
          setTakenChars(taken)
        })

      } catch {
        setError("Sala não encontrada ou servidor offline.")
        setConnecting(false)
      }
    }

    connect()

    return () => {
      // Não sai da sala se está indo para o jogo
      if (!navigatingRef.current) room?.leave()
    }
  }, [roomCode, nickname])

  // Ref para acessar selectedChar no closure do onMessage
  const selectedCharRef = useRef(selectedChar)
  useEffect(() => { selectedCharRef.current = selectedChar }, [selectedChar])

  const handleSelectChar = (charId: string) => {
    if (takenChars.includes(charId) && charId !== selectedChar) return
    setSelectedChar(charId)
    roomRef.current?.send("selectCharacter", { characterId: charId, nickname })
  }

  const handleStart = () => {
    setHostError("")
    roomRef.current?.send("startGame")
  }

  const canStart = isHost && players.length === 2 && players.every(p => p.characterId !== "")

  if (connecting) return <LoadingScreen message="Conectando à sala..." />

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "2rem 1rem",
    }}>
      <div style={{ width: "100%", maxWidth: 640 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Sala Privada
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", fontFamily: "monospace", letterSpacing: "0.06em" }}>
              {roomCode}
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomCode)
            }}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid #1a1a1a", background: "#0e0e0e",
              color: "var(--text-muted)", fontSize: 11,
              fontFamily: "monospace", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}
          >
            Copiar código
          </button>
        </div>

        {/* Jogadores */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Jogadores ({players.length}/2)</SectionTitle>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1].map(i => {
              const p = players[i]
              const char = p ? CHARACTERS.find(c => c.id === p.characterId) : null
              return (
                <div key={i} style={{
                  flex: 1, padding: "14px 16px",
                  background: "#0e0e0e",
                  border: p ? `1px solid ${char ? hex(char.color) + "44" : "#2a2a2a"}` : "1px dashed #1a1a1a",
                  borderRadius: 10,
                  transition: "all 0.3s",
                }}>
                  {p ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {p.isHost && (
                          <span style={{ fontSize: 9, background: "rgba(14,165,233,0.15)", color: "var(--accent-bright)", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", textTransform: "uppercase" }}>
                            Host
                          </span>
                        )}
                        {p.id === mySessionId && (
                          <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "monospace" }}>
                            (você)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{p.nickname}</div>
                      {char ? (
                        <div style={{ fontSize: 11, color: hex(char.color), fontFamily: "monospace", marginTop: 2 }}>
                          {char.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginTop: 2 }}>
                          Escolhendo personagem...
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
                      Aguardando...
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Seleção de personagem */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Escolha seu personagem</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {CHARACTERS.map(char => {
              const isTaken = takenChars.includes(char.id) && char.id !== selectedChar
              const isMine = selectedChar === char.id
              const color = hex(char.color)
              return (
                <motion.button
                  key={char.id}
                  onClick={() => !isTaken && handleSelectChar(char.id)}
                  whileHover={!isTaken ? { scale: 1.02 } : {}}
                  whileTap={!isTaken ? { scale: 0.98 } : {}}
                  style={{
                    padding: "12px 14px",
                    background: isMine ? `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.12)` : "#0e0e0e",
                    border: isMine ? `1px solid ${color}66` : isTaken ? "1px solid #1a1a1a" : "1px solid #222",
                    borderRadius: 10,
                    cursor: isTaken ? "not-allowed" : "pointer",
                    opacity: isTaken ? 0.4 : 1,
                    textAlign: "left",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: isMine ? `0 0 8px ${color}` : "none" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: isMine ? color : "var(--text-primary)" }}>
                      {char.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{char.description}</div>
                  {isTaken && (
                    <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, color: "#ef4444", fontFamily: "monospace" }}>
                      TOMADO
                    </div>
                  )}
                  {isMine && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: color }} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Erros */}
        <AnimatePresence>
          {(error || hostError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                fontSize: 12, color: "#ef4444", fontFamily: "monospace",
              }}
            >
              {error || hostError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", marginBottom: 16 }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: "var(--accent-bright)", fontFamily: "monospace" }}>
                {countdown}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>Iniciando...</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão iniciar (só host) */}
        {isHost && !countdown && (
          <motion.button
            onClick={handleStart}
            disabled={!canStart}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
            style={{
              width: "100%", padding: "14px 0",
              background: canStart ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.03)",
              border: canStart ? "1px solid rgba(14,165,233,0.4)" : "1px solid #1a1a1a",
              borderRadius: 10, cursor: canStart ? "pointer" : "not-allowed",
              color: canStart ? "var(--accent-bright)" : "var(--text-muted)",
              fontSize: 14, fontWeight: 700, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}
          >
            {players.length < 2
              ? "Aguardando 2º jogador..."
              : !players.every(p => p.characterId !== "")
              ? "Todos devem escolher um personagem"
              : "▶ Iniciar Partida"}
          </motion.button>
        )}

        {!isHost && !countdown && (
          <div style={{
            textAlign: "center", padding: "14px",
            background: "#0e0e0e", border: "1px solid #1a1a1a",
            borderRadius: 10, fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace",
          }}>
            Aguardando o host iniciar a partida...
          </div>
        )}
      </div>
    </main>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
      {children}
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(14,165,233,0.15)", borderTop: "2px solid var(--accent-primary)", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "monospace" }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
