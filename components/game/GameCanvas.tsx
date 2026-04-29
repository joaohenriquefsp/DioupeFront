"use client"

import { useEffect, useRef, useState } from "react"

interface HUDData {
  hp: number
  maxHp: number
  abilityCooldown: number
  abilityMaxCooldown: number
}

interface GameCanvasProps {
  characterId: string
  nickname: string
  onHUDUpdate?: (data: HUDData) => void
}

export default function GameCanvas({ characterId, nickname, onHUDUpdate }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<unknown>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    let cancelled = false

    const initPhaser = async () => {
      const { default: Phaser } = await import("phaser")
      const { createPhaserGame } = await import("@/game/PhaserGame")

      if (cancelled || !containerRef.current) return

      gameRef.current = createPhaserGame({
        parent: containerRef.current,
        characterId,
        nickname,
        onHUDUpdate,
      })

      setReady(true)
    }

    initPhaser()

    return () => {
      cancelled = true
      if (gameRef.current) {
        ;(gameRef.current as { destroy: (b: boolean) => void }).destroy(true)
        gameRef.current = null
      }
    }
  }, [characterId, nickname, onHUDUpdate])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    />
  )
}
