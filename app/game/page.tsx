"use client"

import { Suspense, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import HUD from "@/components/game/HUD"
import { getCharacter } from "@/game/config/characters"

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), { ssr: false })

interface HUDState {
  hp: number
  maxHp: number
  abilityCooldown: number
  abilityMaxCooldown: number
}

function GameView() {
  const params = useSearchParams()
  const router = useRouter()
  const characterId = params.get("character") ?? "dioupe"
  const nickname = params.get("nickname") ?? "Player"

  const char = getCharacter(characterId)
  const [hudState, setHUDState] = useState<HUDState>({
    hp: char?.hp ?? 100,
    maxHp: char?.hp ?? 100,
    abilityCooldown: 0,
    abilityMaxCooldown: char?.ability.cooldown ?? 5000,
  })

  const handleHUDUpdate = useCallback((data: HUDState) => {
    setHUDState(data)
  }, [])

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* HUD overlay */}
      <HUD
        hp={hudState.hp}
        maxHp={hudState.maxHp}
        abilityCooldown={hudState.abilityCooldown}
        abilityMaxCooldown={hudState.abilityMaxCooldown}
        characterId={characterId}
        nickname={nickname}
      />

      {/* Exit button */}
      <button
        onClick={() => router.push("/lobby")}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 30,
          background: "rgba(5,7,15,0.8)",
          border: "1px solid rgba(14,165,233,0.15)",
          borderRadius: 8,
          color: "var(--text-muted)",
          fontSize: 11,
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        ← Lobby
      </button>

      {/* Game canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <GameCanvas
          characterId={characterId}
          nickname={nickname}
          onHUDUpdate={handleHUDUpdate}
        />
      </div>
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<Loading />}>
      <GameView />
    </Suspense>
  )
}

function Loading() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid rgba(14,165,233,0.15)",
          borderTop: "2px solid var(--accent-primary)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "monospace" }}>
        Carregando arena...
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
