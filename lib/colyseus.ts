import { Client, Room } from "colyseus.js"

const SERVER_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567"

let _client: Client | null = null

export function getColyseusClient(): Client {
  if (!_client) _client = new Client(SERVER_URL)
  return _client
}

export async function createPrivateRoom(nickname: string, mapId = "praca-cine"): Promise<Room> {
  const client = getColyseusClient()
  return client.create("battle_private", { nickname, mapId })
}

export async function joinPrivateRoom(roomId: string, nickname: string): Promise<Room> {
  const client = getColyseusClient()
  return client.joinById(roomId, { nickname })
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
