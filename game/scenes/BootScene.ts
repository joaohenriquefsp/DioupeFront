import * as Phaser from "phaser"
import { CHARACTERS } from "../config/characters"
import { getGameInitData } from "../PhaserGame"

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" })
  }

  preload() {}

  create() {
    const { characterId, nickname, onHUDUpdate } = getGameInitData()

    const makeGfx = () => this.make.graphics({})

    if (!this.textures.exists("char-dioupe")) {
      for (const char of CHARACTERS) {
        const g = makeGfx()
        g.fillStyle(char.color)
        g.fillRoundedRect(0, 0, 32, 48, 4)
        g.fillStyle(0x05070f)
        g.fillRect(20, 12, 5, 5)
        g.generateTexture(`char-${char.id}`, 32, 48)
        g.destroy()
      }

      const ground = makeGfx()
      ground.fillStyle(0x0ea5e9)
      ground.fillRect(0, 0, 16, 16)
      ground.generateTexture("ground-tile", 16, 16)
      ground.destroy()

      const platform = makeGfx()
      platform.fillStyle(0x1e3a5f)
      platform.fillRect(0, 0, 16, 16)
      platform.fillStyle(0x0ea5e9)
      platform.fillRect(0, 0, 16, 3)
      platform.generateTexture("platform-tile", 16, 16)
      platform.destroy()

      const hit = makeGfx()
      hit.fillStyle(0xffffff, 0.8)
      hit.fillRect(0, 0, 40, 56)
      hit.generateTexture("hit-flash", 40, 56)
      hit.destroy()
    }

    this.scene.start("BattleScene", { characterId, nickname, onHUDUpdate })
  }
}
