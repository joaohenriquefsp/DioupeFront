import { Schema, defineTypes } from "@colyseus/schema"

export class PlayerState extends Schema {
  declare id: string
  declare x: number
  declare y: number
  declare hp: number
  declare maxHp: number
  declare characterId: string
  declare alive: boolean
  declare nickname: string
  declare facingRight: boolean
  declare abilityCooldown: number
  declare vx: number
  declare vy: number
  declare ready: boolean
  declare isHost: boolean
}

defineTypes(PlayerState, {
  id:             "string",
  x:              "number",
  y:              "number",
  hp:             "number",
  maxHp:          "number",
  characterId:    "string",
  alive:          "boolean",
  nickname:       "string",
  facingRight:    "boolean",
  abilityCooldown:"number",
  vx:             "number",
  vy:             "number",
  ready:          "boolean",
  isHost:         "boolean",
})
