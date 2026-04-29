"use client"

import { getCharacter } from "@/game/config/characters"

interface HUDProps {
  hp: number
  maxHp: number
  abilityCooldown: number
  abilityMaxCooldown: number
  characterId: string
  nickname: string
  alivePlayers?: number
}

export default function HUD({
  hp,
  maxHp,
  abilityCooldown,
  abilityMaxCooldown,
  characterId,
  nickname,
  alivePlayers,
}: HUDProps) {
  const char = getCharacter(characterId)
  const hpPct = Math.max(0, hp / maxHp)
  const abilityCooldownPct = abilityCooldown > 0 ? abilityCooldown / abilityMaxCooldown : 0
  const abilityReady = abilityCooldown === 0

  const hpColor =
    hpPct > 0.5 ? "#22c55e" : hpPct > 0.25 ? "#f97316" : "#ef4444"

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 20,
        pointerEvents: "none",
        background:
          "linear-gradient(to bottom, rgba(5,7,15,0.85) 0%, transparent 100%)",
      }}
    >
      {/* Player info + HP */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: 11,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {nickname}
          {char ? ` · ${char.name}` : ""}
        </span>

        {/* HP bar */}
        <div
          style={{
            width: 180,
            height: 8,
            background: "rgba(14,165,233,0.1)",
            borderRadius: 4,
            border: "1px solid rgba(14,165,233,0.15)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${hpPct * 100}%`,
              height: "100%",
              background: hpColor,
              borderRadius: 4,
              transition: "width 0.2s ease, background 0.3s ease",
            }}
          />
        </div>

        <span style={{ color: hpColor, fontSize: 11, fontFamily: "monospace" }}>
          {hp} / {maxHp} HP
        </span>
      </div>

      {/* Players alive */}
      {alivePlayers !== undefined && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase" }}>
            Vivos
          </span>
          <span
            style={{
              color: "var(--accent-bright)",
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "monospace",
              lineHeight: 1,
            }}
          >
            {alivePlayers}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        {/* J e K — sem cooldown visível */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <KeyBadge label="J" />
          <span style={{ color: "var(--text-muted)", fontSize: 9, fontFamily: "monospace" }}>ATAQUE</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <KeyBadge label="K" />
          <span style={{ color: "var(--text-muted)", fontSize: 9, fontFamily: "monospace" }}>FORTE</span>
        </div>

        {/* L — especial com cooldown */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <KeyBadge label="L" active={abilityReady} />
          <div
            style={{
              width: 40,
              height: 4,
              background: abilityReady ? "rgba(14,165,233,0.2)" : "rgba(14,165,233,0.08)",
              borderRadius: 2,
              border: `1px solid ${abilityReady ? "rgba(14,165,233,0.5)" : "rgba(14,165,233,0.15)"}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: abilityReady ? "100%" : `${(1 - abilityCooldownPct) * 100}%`,
                height: "100%",
                background: abilityReady ? "var(--accent-primary)" : "var(--text-muted)",
                borderRadius: 2,
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <span style={{ color: abilityReady ? "var(--accent-bright)" : "var(--text-muted)", fontSize: 9, fontFamily: "monospace" }}>
            {abilityReady ? "PRONTO" : `${(abilityCooldown / 1000).toFixed(1)}s`}
          </span>
        </div>
      </div>
    </div>
  )
}

function KeyBadge({ label, active = true }: { label: string; active?: boolean }) {
  return (
    <div style={{
      width: 24, height: 24,
      borderRadius: 5,
      border: `1px solid ${active ? "rgba(14,165,233,0.5)" : "rgba(14,165,233,0.15)"}`,
      background: active ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.04)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", fontWeight: 700, fontSize: 11,
      color: active ? "var(--accent-bright)" : "var(--text-muted)",
    }}>
      {label}
    </div>
  )
}
