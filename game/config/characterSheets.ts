export type SpecialType = "projectile" | "flash-stun" | "teleport" | "super-jump" | "shield"

export interface CharacterSheet {
  id: string
  isAnimated: boolean
  prefix: string        // "dioupe" | "bw" | ""
  scale: number
  bodyW: number
  bodyH: number
  offsetX: number
  offsetY: number
  nameLabelOffset: number
  specialType: SpecialType
}

const SHEETS: Record<string, CharacterSheet> = {
  dioupe: {
    id: "dioupe", isAnimated: true, prefix: "dioupe",
    scale: 0.85, bodyW: 65, bodyH: 112, offsetX: 32, offsetY: 14,
    nameLabelOffset: 65, specialType: "projectile",
  },
  "boletas-wolf": {
    id: "boletas-wolf", isAnimated: true, prefix: "bw",
    scale: 0.75, bodyW: 55, bodyH: 100, offsetX: 37, offsetY: 20,
    nameLabelOffset: 55, specialType: "flash-stun",
  },
  deco: {
    id: "deco", isAnimated: false, prefix: "",
    scale: 1, bodyW: 32, bodyH: 48, offsetX: 0, offsetY: 0,
    nameLabelOffset: 36, specialType: "shield",
  },
  ana: {
    id: "ana", isAnimated: false, prefix: "",
    scale: 1, bodyW: 32, bodyH: 48, offsetX: 0, offsetY: 0,
    nameLabelOffset: 36, specialType: "teleport",
  },
  pedro: {
    id: "pedro", isAnimated: false, prefix: "",
    scale: 1, bodyW: 32, bodyH: 48, offsetX: 0, offsetY: 0,
    nameLabelOffset: 36, specialType: "super-jump",
  },
}

const FALLBACK: CharacterSheet = SHEETS["deco"]

export function getSheet(characterId: string): CharacterSheet {
  return SHEETS[characterId] ?? FALLBACK
}
