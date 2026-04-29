import { Schema, MapSchema, ArraySchema, defineTypes } from "@colyseus/schema"
import { PlayerState } from "./PlayerState"

export class GameState extends Schema {
  declare players: MapSchema<PlayerState>
  declare takenCharacters: ArraySchema<string>
  declare alivePlayers: number
  declare gameStarted: boolean
  declare inLobby: boolean
  declare winner: string
  declare roomId: string
  declare hostId: string
  declare mapId: string
}

defineTypes(GameState, {
  players:         { map: PlayerState },
  takenCharacters: ["string"],
  alivePlayers:    "number",
  gameStarted:     "boolean",
  inLobby:         "boolean",
  winner:          "string",
  roomId:          "string",
  hostId:          "string",
  mapId:           "string",
})
