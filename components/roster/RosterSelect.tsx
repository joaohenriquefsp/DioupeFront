"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CHARACTERS, type CharacterConfig } from "@/game/config/characters"

const CHAR_BUCKET = "79566d70-8b93-4c2b-b976-8a8102628cbd"
const CHAR_UUID   = "4c988263-f532-477c-a9d5-a1930d429ec0"
const BASE_ROT    = `https://backblaze.pixellab.ai/file/pixellab-characters/${CHAR_BUCKET}/${CHAR_UUID}/rotations/`
const DIRS        = ["south","south-east","east","north-east","north","north-west","west","south-west"]

const rotationUrls: Record<string, string[]> = {
  dioupe:        DIRS.map(d => `${BASE_ROT}${d}.png`),
  "boletas-wolf": DIRS.map(d => `/assets/sprites/BoletasWolf/rotations/${d}.png`),
}

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`
const rgb = (n: number) => `${(n>>16)&255},${(n>>8)&255},${n&255}`

interface Props { selected: string; onSelect: (id: string) => void }

export default function RosterSelect({ selected, onSelect }: Props) {
  const char = CHARACTERS.find(c => c.id === selected) ?? CHARACTERS[0]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Seleção de personagem */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {CHARACTERS.map((c, i) => (
          <motion.button
            key={c.id}
            onClick={() => onSelect(c.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: selected === c.id ? `rgba(${rgb(c.color)},0.1)` : "#0e0e0e",
              border: selected === c.id ? `1px solid ${hex(c.color)}66` : "1px solid #1a1a1a",
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: hex(c.color),
              boxShadow: selected === c.id ? `0 0 6px ${hex(c.color)}` : "none",
            }} />
            <span style={{
              fontSize: 12, fontFamily: "monospace",
              fontWeight: selected === c.id ? 700 : 400,
              color: selected === c.id ? hex(c.color) : "#ffffff44",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              {c.name}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Card do personagem selecionado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={char.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CharacterCard char={char} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function CharacterCard({ char }: { char: CharacterConfig }) {
  const color  = hex(char.color)
  const urls   = rotationUrls[char.id]
  const [dirIdx, setDirIdx] = useState(2)

  useEffect(() => { setDirIdx(2) }, [char.id])

  // Drag para girar — só manual, sem auto-rotate
  const dragging  = useRef(false)
  const dragStart = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = e.clientX
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const delta = e.clientX - dragStart.current
    if (Math.abs(delta) > 20) {
      setDirIdx(i => (i + (delta > 0 ? 1 : -1) + DIRS.length) % DIRS.length)
      dragStart.current = e.clientX
    }
  }
  const stopDrag = () => { dragging.current = false }

  const touchStart = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true
    touchStart.current = e.touches[0].clientX
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    const delta = e.touches[0].clientX - touchStart.current
    if (Math.abs(delta) > 20) {
      setDirIdx(i => (i + (delta > 0 ? 1 : -1) + DIRS.length) % DIRS.length)
      touchStart.current = e.touches[0].clientX
    }
  }

  return (
    <div style={{
      background: "#0a0a0a",
      border: `1px solid ${color}22`,
      borderRadius: 12,
      overflow: "hidden",
      userSelect: "none",
    }}>
      {/* Sprite */}
      <div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDrag}
        style={{
          position: "relative",
          height: 320,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          cursor: "grab",
          overflow: "hidden",
          paddingBottom: 16,
        }}
      >
        {/* Vinheta */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 40%, transparent 35%, #0a0a0a 100%)`,
        }} />

        {/* Chão */}
        <div style={{
          position: "absolute", bottom: 20, left: "10%", right: "10%", zIndex: 1,
          height: 1, background: `${color}18`,
        }} />
        <div style={{
          position: "absolute", bottom: 20, left: "10%", right: "10%", zIndex: 1,
          height: 30, background: `linear-gradient(to bottom, ${color}08, transparent)`,
        }} />

        {urls ? (
          <img
            src={urls[dirIdx]}
            alt={char.name}
            draggable={false}
            style={{
              height: 280,
              width: 280,
              objectFit: "contain",
              imageRendering: "pixelated",
              position: "relative",
              zIndex: 1,
              transform: `scale(${char.id === "dioupe" ? 1.7 : 1})`,
              transformOrigin: "center center",
            }}
          />
        ) : (
          <div style={{
            width: 100, height: 160,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            borderRadius: 6,
            zIndex: 1,
          }} />
        )}

        {/* Hint */}
        <div style={{
          position: "absolute", bottom: 6, zIndex: 3,
          fontSize: 9, color: "#ffffff18",
          fontFamily: "monospace", letterSpacing: "0.08em",
        }}>
          ← arraste para girar →
        </div>
      </div>

      {/* Info */}
      <div style={{ background: "#0d0d0d", borderTop: `1px solid ${color}18`, padding: "14px 16px" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 20, fontWeight: 900, color,
            fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1,
          }}>
            {char.name}
          </div>
          <div style={{ fontSize: 9, color: "#ffffff22", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 4 }}>
            {char.gang}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          {([["VIDA", char.hp, 200], ["DANO", char.damage, 100], ["PODER", char.power, 100], ["VELOCIDADE", char.speed, 300]] as const).map(
            ([label, val, max]) => <AttrRow key={label} label={label} value={val} max={max} color={color} />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: "#ffffff22", fontFamily: "monospace", textTransform: "uppercase" }}>Habilidade</span>
          <span style={{ fontSize: 9, color, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {char.ability.name} · {char.ability.cooldown / 1000}s CD
          </span>
        </div>

        <div style={{ fontSize: 10, color: "#ffffff22", fontStyle: "italic", lineHeight: 1.5, marginBottom: 10 }}>
          {char.personality}
        </div>

        <div style={{ fontSize: 10, color: `${color}77`, fontFamily: "monospace", fontStyle: "italic", borderLeft: `2px solid ${color}33`, paddingLeft: 10 }}>
          {char.quote}
        </div>
      </div>
    </div>
  )
}

function AttrRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 9, fontFamily: "monospace", color: "#ffffff22", textTransform: "uppercase", letterSpacing: "0.06em", width: 70, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: "#ffffff08", borderRadius: 1, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 1 }}
        />
      </div>
      <span style={{ fontSize: 9, fontFamily: "monospace", color: "#ffffff33", width: 26, textAlign: "right" }}>
        {value}
      </span>
    </div>
  )
}
