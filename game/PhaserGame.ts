import * as Phaser from "phaser"
import { BootScene } from "./scenes/BootScene"
import { BattleScene } from "./scenes/BattleScene"
import { ResultScene } from "./scenes/ResultScene"

interface GameOptions {
  parent: HTMLElement
  characterId?: string
  nickname?: string
  online?: boolean
  onHUDUpdate?: (data: {
    hp: number
    maxHp: number
    abilityCooldown: number
    abilityMaxCooldown: number
  }) => void
}

// Variável de módulo — disponível antes de qualquer cena iniciar
let _gameInitData: {
  characterId: string
  nickname: string
  online: boolean
  onHUDUpdate?: GameOptions["onHUDUpdate"]
} = { characterId: "dioupe", nickname: "Player", online: false }

export function getGameInitData() {
  return _gameInitData
}

export function createPhaserGame(options: GameOptions): Phaser.Game {
  const { parent, characterId = "dioupe", nickname = "Player", onHUDUpdate } = options

  const online = options.online ?? false
  _gameInitData = { characterId, nickname, onHUDUpdate, online }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 500,
    backgroundColor: "#05070f",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 600, x: 0 }, debug: false },
    },
    scene: [BootScene, BattleScene, ResultScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }

  return new Phaser.Game(config)
}
