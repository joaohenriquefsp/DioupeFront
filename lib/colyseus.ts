import { Client, Room } from "colyseus.js"
import { GameState } from "./schemas/GameState"

export type { GameState }

const SERVER_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567"

let _client: Client | null = null

export function getColyseusClient(): Client {
  if (!_client) _client = new Client(SERVER_URL)
  return _client
}

export async function createPrivateRoom(nickname: string, mapId = "praca-cine"): Promise<Room<GameState>> {
  const client = getColyseusClient()
  return client.create<GameState>("battle_private", { nickname, mapId }, GameState)
}

export async function joinPrivateRoom(roomId: string, nickname: string): Promise<Room<GameState>> {
  const client = getColyseusClient()
  return client.joinById<GameState>(roomId, { nickname }, GameState)
}

export async function findRoomByCode(code: string): Promise<string | null> {
  try {
    const base = SERVER_URL.replace("ws://", "http://").replace("wss://", "https://")
    const res = await fetch(`${base}/find/${encodeURIComponent(code.toUpperCase())}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.roomId ?? null
  } catch {
    return null
  }
}

export async function checkServerOnline(): Promise<boolean> {
  try {
    const base = SERVER_URL.replace("ws://", "http://").replace("wss://", "https://")
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}
