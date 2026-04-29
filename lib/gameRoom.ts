import { Room } from "colyseus.js"

let _room: Room | null = null

export function setActiveRoom(room: Room) { _room = room }
export function getActiveRoom(): Room | null { return _room }
export function clearActiveRoom() { _room = null }
