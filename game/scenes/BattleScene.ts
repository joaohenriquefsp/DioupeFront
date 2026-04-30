import * as Phaser from "phaser"
import { CHARACTERS, getCharacter } from "../config/characters"
import { getActiveRoom, clearActiveRoom } from "../../lib/gameRoom"

const SPEED = 200
const JUMP_VY = -500
const DOUBLE_JUMP_VY = -440
const ATTACK_RANGE_X = 65
const ATTACK_RANGE_Y = 60
const ATTACK_DAMAGE = 20
const ATTACK_COOLDOWN = 400
const BOT_SPEED = 110
const GRAVITY_EXTRA = 700
const SHOW_ATTACK_FX = process.env.NODE_ENV === "development"

// Combat mechanics (Dota-style)
const TURN_DELAY = 180           // ms to turn before attacking opposite direction
const TURN_MOVE_DELAY = 80       // ms to turn when changing movement direction
const ATTACK_FPS = 12
const ATTACK_TOTAL_FRAMES = 6
const ATTACK_POINT_FRAME = 1     // frame 1 de 4 = pico do swing do bastão
const ATTACK_POINT_MS = (ATTACK_POINT_FRAME / ATTACK_FPS) * 1000
const ALLOW_BACKSWING_CANCEL = true

interface HUDData {
  hp: number
  maxHp: number
  abilityCooldown: number
  abilityMaxCooldown: number
}

interface Bot {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  hp: number
  maxHp: number
  color: number
  nameLabel: Phaser.GameObjects.Text
  hpBarBg: Phaser.GameObjects.Graphics
  hpBar: Phaser.GameObjects.Graphics
  direction: number
  dirTimer: number
  jumpTimer: number
  alive: boolean
  stunTimer: number
}

export class BattleScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyA!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keyW!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyJ!: Phaser.Input.Keyboard.Key
  private keyK!: Phaser.Input.Keyboard.Key
  private keyL!: Phaser.Input.Keyboard.Key
  private attack2Cooldown = 0

  private jumpCount = 0
  private readonly MAX_JUMPS = 2
  private attackCooldown = 0
  private abilityCooldown = 0
  private abilityMaxCooldown = 5000
  private shielded = false

  private hp = 100
  private maxHp = 100
  private characterId = "dioupe"
  private nickname = "Player"
  private facingLeft = false

  // Combat state
  private isAttacking = false
  private isTurning = false
  private turnMoveTimer = 0       // remaining ms of movement turn delay
  private attackCooldownDamage = 0
  private comboQueued = false

  private nameLabel!: Phaser.GameObjects.Text
  private bots: Bot[] = []
  private onHUDUpdate?: (data: HUDData) => void
  private projectiles!: Phaser.Physics.Arcade.Group
  private online = false
  private remotePlayer?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private remoteNameLabel?: Phaser.GameObjects.Text
  private remoteHPBar?: Phaser.GameObjects.Graphics
  private remoteHPBarBg?: Phaser.GameObjects.Graphics
  private remoteHP = 100
  private remoteMaxHP = 100
  private remoteDead = false
  private remoteCharacterId = ""
  private remoteVX = 0
  private syncTimer = 0

  constructor() {
    super({ key: "BattleScene" })
  }

  init(data: { characterId?: string; nickname?: string; online?: boolean; onHUDUpdate?: (d: HUDData) => void }) {
    this.characterId = data.characterId ?? "dioupe"
    this.nickname    = data.nickname ?? "Player"
    this.online      = data.online ?? false
    this.onHUDUpdate = data.onHUDUpdate
    this.bots        = []
    this.shielded    = false
  }

  preload() {
    if (!this.textures.exists("map-praca-cine"))
      this.load.image("map-praca-cine", "/assets/maps/praca-cine.png")

    const base = "/assets/sprites/dioupe"
    const load = (key: string, file: string, fw: number, fh: number) => {
      if (!this.textures.exists(key))
        this.load.spritesheet(key, `${base}/${file}`, { frameWidth: fw, frameHeight: fh })
    }
    load("dioupe-idle",           "idle.png",           128, 128)
    load("dioupe-walk-left",      "walk-left.png",      128, 128)
    load("dioupe-walk-right",     "walk-right.png",     128, 128)
    load("dioupe-attack-right",   "attack-right.png",   128, 128)
    load("dioupe-attack-left",    "attack-left.png",    128, 128)
    load("dioupe-attack2",        "attack2.png",        128, 128)
    load("dioupe-special-left",   "special-left.png",   128, 128)
    load("dioupe-special-right",  "special-right.png",  128, 128)
    load("dioupe-power-right",    "power-right.png",    128, 128)
    load("dioupe-power-left",     "power-left.png",     128, 128)

    const bw = "/assets/sprites/BoletasWolf"
    const loadBW = (key: string, file: string, fw: number) => {
      if (!this.textures.exists(key))
        this.load.spritesheet(key, `${bw}/${file}`, { frameWidth: fw, frameHeight: fw })
    }
    loadBW("bw-idle",          "idle.png",         128)
    loadBW("bw-walk-left",     "walk-left.png",    128)
    loadBW("bw-walk-right",    "walk-right.png",   128)
    loadBW("bw-attack-right",  "attack-right.png", 128)
    loadBW("bw-attack-left",   "attack-left.png",  128)
    loadBW("bw-attack2",       "attack2.png",      128)
    loadBW("bw-special-left",  "special-left.png", 128)
    loadBW("bw-special-right", "special-right.png",128)
    loadBW("bw-flash-skill",   "flash-skill.png",  128)
  }

  create() {
    const reg = (key: string, tex: string, end: number, fps: number, loop: boolean) => {
      if (!this.anims.exists(key))
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end }), frameRate: fps, repeat: loop ? -1 : 0 })
    }
    reg("dioupe-idle",          "dioupe-idle",          7, 8,  true)
    reg("dioupe-walk-left",     "dioupe-walk-left",     7, 8,  true)
    reg("dioupe-walk-right",    "dioupe-walk-right",    7, 8,  true)
    reg("dioupe-attack-right",  "dioupe-attack-right",  3, 7, false)
    reg("dioupe-attack-left",   "dioupe-attack-left",   3, 7, false)
    reg("dioupe-attack2",       "dioupe-attack2",       4, 7, false)
    reg("dioupe-special-left",  "dioupe-special-left",  8, 6,  false)
    reg("dioupe-special-right", "dioupe-special-right", 8, 6,  false)

    reg("bw-idle",          "bw-idle",          8, 8,  true)
    reg("bw-walk-left",     "bw-walk-left",     4, 8,  true)
    reg("bw-walk-right",    "bw-walk-right",    4, 8,  true)
    reg("bw-attack-right",  "bw-attack-right",  3, 7,  false)
    reg("bw-attack-left",   "bw-attack-left",   3, 7,  false)
    reg("bw-attack2",       "bw-attack2",       3, 7,  false)
    reg("bw-special-left",  "bw-special-left",  3, 6,  false)
    reg("bw-special-right", "bw-special-right", 3, 6,  false)
    reg("bw-flash-skill",   "bw-flash-skill",   3, 8,  false)
    const regFrames = (key: string, tex: string, frames: number[], fps: number, loop: boolean) => {
      if (!this.anims.exists(key))
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { frames }), frameRate: fps, repeat: loop ? -1 : 0 })
    }
    regFrames("dioupe-power-right-intro",  "dioupe-power-right", [0,1,2,3], 6, false)
    regFrames("dioupe-power-right-travel", "dioupe-power-right", [2,3],     5, true)
    regFrames("dioupe-power-right-impact", "dioupe-power-right", [4],       6, false)
    regFrames("dioupe-power-left-intro",   "dioupe-power-left",  [0,1,2,3], 6, false)
    regFrames("dioupe-power-left-travel",  "dioupe-power-left",  [2,3],     5, true)
    regFrames("dioupe-power-left-impact",  "dioupe-power-left",  [4],       6, false)

    const W = this.scale.width
    const H = this.scale.height

    const char = getCharacter(this.characterId)
    if (char) {
      this.hp = char.hp
      this.maxHp = char.hp
      this.abilityMaxCooldown = char.ability.cooldown
    }

    const bg = this.add.image(W / 2, H / 2, "map-praca-cine")
    bg.setDisplaySize(W, H)
    bg.setDepth(0)

    this.buildLevel(W, H)

    // Player
    const spawnX = W / 2
    const spawnY = H - 120
    const isDioupe = this.characterId === "dioupe"
    const isBW     = this.characterId === "boletas-wolf"
    const playerTexture = isDioupe ? "dioupe-idle" : isBW ? "bw-idle" : `char-${this.characterId}`
    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture)
    this.player.setCollideWorldBounds(true)
    this.player.body.setGravityY(GRAVITY_EXTRA)
    this.player.setDepth(10)
    if (isDioupe) {
      this.player.setScale(0.75)
      this.player.body.setSize(55, 100).setOffset(37, 20)
      this.player.play("dioupe-idle")
    }
    if (isBW) {
      this.player.setScale(0.75)
      this.player.body.setSize(55, 100).setOffset(37, 20)
      this.player.play("bw-idle")
    }

    this.nameLabel = this.add
      .text(spawnX, spawnY - 36, this.nickname, {
        fontSize: "11px",
        color: "#f0f4ff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(11)

    this.physics.add.collider(this.player, this.platforms)

    this.projectiles = this.physics.add.group()

    // Bots (apenas no modo solo)
    if (!this.online) this.spawnBots(W, H)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyJ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)
    this.keyK = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K)
    this.keyL = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L)

    if (this.online) this.setupOnline(W, H)

    this.emitHUD()
  }

  private syncOnline(delta: number) {
    const room = getActiveRoom()
    if (!room) return

    this.syncTimer += delta
    if (this.syncTimer >= 50) {  // 20fps
      this.syncTimer = 0
      room.send("position", { x: this.player.x, y: this.player.y })
      room.send("move", {
        vx: this.player.body.velocity.x,
        vy: this.player.body.velocity.y
      })
    }
  }

  private drawRemoteHP() {
    if (!this.remotePlayer || !this.remoteHPBar || !this.remoteHPBarBg) return
    const barW = 40, barH = 4
    const x = this.remotePlayer.x - barW / 2
    const y = this.remotePlayer.y - 50

    this.remoteHPBarBg.clear()
    this.remoteHPBarBg.fillStyle(0x1a1a2e)
    this.remoteHPBarBg.fillRect(x, y, barW, barH)

    const pct = Math.max(0, this.remoteHP / this.remoteMaxHP)
    const color = pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xf97316 : 0xef4444
    this.remoteHPBar.clear()
    this.remoteHPBar.fillStyle(color)
    this.remoteHPBar.fillRect(x, y, barW * pct, barH)
  }

  private applyRemoteCharacter(characterId: string) {
    if (!this.remotePlayer) return
    this.remoteCharacterId = characterId
    const isDioupe = characterId === "dioupe"
    const isBW     = characterId === "boletas-wolf"
    const tex      = isDioupe ? "dioupe-idle" : isBW ? "bw-idle" : `char-${characterId}`
    this.remotePlayer.setTexture(tex)
    if (isDioupe || isBW) {
      this.remotePlayer.setScale(0.75)
      this.remotePlayer.body.setSize(55, 100)
      this.remotePlayer.body.setOffset(37, 20)
      this.remotePlayer.play(isDioupe ? "dioupe-idle" : "bw-idle")
    } else {
      this.remotePlayer.setScale(1)
      this.remotePlayer.body.setSize(32, 48)
      this.remotePlayer.body.setOffset(0, 0)
    }
  }

  private setupOnline(W: number, H: number) {
    const room = getActiveRoom()
    if (!room) return

    const myId = room.sessionId

    this.remotePlayer = this.physics.add.sprite(W / 2 + 100, H - 120, "char-dioupe")
    this.remotePlayer.setCollideWorldBounds(true)
    this.remotePlayer.body.setGravityY(GRAVITY_EXTRA)
    this.remotePlayer.setDepth(10)
    this.remotePlayer.setVisible(false)
    this.remoteCharacterId = ""

    this.remoteNameLabel = this.add.text(0, 0, "", {
      fontSize: "11px", color: "#f0f4ff", fontFamily: "monospace"
    }).setOrigin(0.5).setDepth(11).setVisible(false)

    this.remoteHPBarBg = this.add.graphics().setDepth(12)
    this.remoteHPBar   = this.add.graphics().setDepth(13)

    this.physics.add.collider(this.remotePlayer, this.platforms)

    // Aplica textura do adversário uma única vez lendo o estado atual
    const initState = (room as any).state
    if (initState?.players) {
      initState.players.forEach((player: any, sessionId: string) => {
        if (sessionId !== myId && player.characterId) {
          this.applyRemoteCharacter(player.characterId)
          this.remotePlayer!.setPosition(player.x || W / 2 + 100, player.y || H - 120)
          this.remotePlayer!.setVisible(true)
          this.remoteNameLabel?.setVisible(true)
          this.remoteNameLabel?.setText(player.nickname || "")
          this.remoteHP    = player.hp    || 100
          this.remoteMaxHP = player.maxHp || 100
        }
      })
    }

    // Recebe estado do servidor — apenas posição e HP
    room.onStateChange((state: any) => {
      state.players.forEach((player: any, sessionId: string) => {
        if (sessionId === myId) {
          if (player.hp !== this.hp) { this.hp = player.hp; this.emitHUD() }
          return
        }

        if (!this.remotePlayer) return

        if (!this.remotePlayer.visible) {
          this.remotePlayer.setVisible(true)
          this.remoteNameLabel?.setVisible(true)
        }

        if (player.characterId && player.characterId !== this.remoteCharacterId) {
          this.applyRemoteCharacter(player.characterId)
        }

        const tx = Phaser.Math.Linear(this.remotePlayer.x, player.x, 0.3)
        const ty = Phaser.Math.Linear(this.remotePlayer.y, player.y, 0.3)
        this.remotePlayer.setPosition(tx, ty)
        this.remotePlayer.setFlipX(!player.facingRight)

        this.remoteNameLabel?.setPosition(tx, ty - 40)
        this.remoteNameLabel?.setText(player.nickname)

        this.remoteHP    = player.hp
        this.remoteMaxHP = player.maxHp
        this.remoteDead  = !player.alive
        this.remoteVX    = player.vx ?? 0

        if (!player.alive && !this.remoteDead) {
          this.tweens.add({
            targets: [this.remotePlayer, this.remoteNameLabel],
            alpha: 0, duration: 500
          })
        }
      })
    })

    // Adversário eliminado
    room.onMessage("playerEliminated", (data: { id: string; nickname: string }) => {
      if (data.id !== myId) {
        // Você ganhou
        this.time.delayedCall(800, () => {
          clearActiveRoom()
          this.scene.start("ResultScene", { winner: this.nickname, characterId: this.characterId })
        })
      }
    })

    // Fim de jogo
    room.onMessage("gameOver", (data: { winner: string; characterId: string }) => {
      clearActiveRoom()
      this.time.delayedCall(800, () => {
        this.scene.start("ResultScene", { winner: data.winner, characterId: data.characterId })
      })
    })
  }

  private spawnBots(W: number, H: number) {
    const botChars = CHARACTERS.filter((c) => c.id !== this.characterId).slice(0, 3)
    const spawnPoints = [
      { x: 140, y: H - 170 },
      { x: W - 140, y: H - 170 },
      { x: W / 2, y: H - 280 },
    ]

    botChars.forEach((char, i) => {
      const { x, y } = spawnPoints[i]
      const sprite = this.physics.add.sprite(x, y, `char-${char.id}`)
      sprite.setCollideWorldBounds(true)
      sprite.body.setGravityY(GRAVITY_EXTRA)
      sprite.setDepth(10)
      this.physics.add.collider(sprite, this.platforms)

      const nameLabel = this.add
        .text(x, y - 36, char.name, {
          fontSize: "11px",
          color: "#f0f4ff",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setDepth(11)

      const hpBarBg = this.add.graphics().setDepth(12)
      const hpBar = this.add.graphics().setDepth(13)

      this.bots.push({
        sprite,
        hp: char.hp,
        maxHp: char.hp,
        color: char.color,
        nameLabel,
        hpBarBg,
        hpBar,
        direction: i % 2 === 0 ? 1 : -1,
        dirTimer: 2000 + Math.random() * 1500,
        jumpTimer: 1500 + Math.random() * 2000,
        alive: true,
        stunTimer: 0,
      })
    })
  }

  private buildLevel(W: number, H: number) {
    this.platforms = this.physics.add.staticGroup()
    for (let x = 0; x < W; x += 16) {
      this.platforms.create(x + 8, H - 16, "ground-tile")
    }
    this.addPlatform(140, H - 130, 160)
    this.addPlatform(W / 2, H - 240, 200)
    this.addPlatform(W - 140, H - 130, 160)
    this.addPlatform(60, H - 230, 80)
    this.addPlatform(W - 60, H - 230, 80)
  }

  private addPlatform(cx: number, cy: number, width: number) {
    for (let x = cx - width / 2; x < cx + width / 2; x += 16) {
      this.platforms.create(x + 8, cy, "platform-tile")
    }
  }

  update(_time: number, delta: number) {
    const body = this.player.body
    const onGround = body.blocked.down
    if (onGround) this.jumpCount = 0

    const nameLabelOffset = this.characterId === "dioupe" ? 52 : this.characterId === "boletas-wolf" ? 55 : 36

    this.nameLabel.setPosition(this.player.x, this.player.y - nameLabelOffset)

    const left = this.cursors.left.isDown || this.keyA.isDown
    const right = this.cursors.right.isDown || this.keyD.isDown

    // Turn move delay — micro-delay ao mudar direção no chão
    if (this.turnMoveTimer > 0) {
      this.turnMoveTimer = Math.max(0, this.turnMoveTimer - delta)
      body.setVelocityX(body.velocity.x * 0.6)
    } else if (!this.isAttacking && !this.isTurning) {
      const isAnimChar = this.characterId === "dioupe" || this.characterId === "boletas-wolf"
      if (left) {
        if (isAnimChar && !this.facingLeft) {
          this.facingLeft = true
          this.turnMoveTimer = TURN_MOVE_DELAY
        } else if (!isAnimChar) this.player.setFlipX(true)
        body.setVelocityX(-SPEED)
      } else if (right) {
        if (isAnimChar && this.facingLeft) {
          this.facingLeft = false
          this.turnMoveTimer = TURN_MOVE_DELAY
        } else if (!isAnimChar) this.player.setFlipX(false)
        body.setVelocityX(SPEED)
      } else {
        body.setVelocityX(body.velocity.x * 0.75)
      }
      if (isAnimChar && !this.isAttacking) this.player.setFlipX(false)
    }

    // Sprite animation — Dioupe e BoletasWolf
    const isAnimChar = this.characterId === "dioupe" || this.characterId === "boletas-wolf"
    const pfx = this.characterId === "dioupe" ? "dioupe" : "bw"
    if (isAnimChar && !this.isTurning && !this.isAttacking) {
      const moving = left || right
      const currentAnim = this.player.anims.currentAnim?.key ?? ""
      if (moving) {
        const walkAnim = this.facingLeft ? `${pfx}-walk-left` : `${pfx}-walk-right`
        if (currentAnim !== walkAnim) { this.player.setFlipX(false); this.player.play(walkAnim) }
      } else {
        this.player.setFlipX(pfx === "dioupe" ? !this.facingLeft : !this.facingLeft)
        if (currentAnim !== `${pfx}-idle`) this.player.play(`${pfx}-idle`)
      }
    }

    // Jump
    const jumpJustDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    if (jumpJustDown && this.jumpCount < this.MAX_JUMPS) {
      body.setVelocityY(this.jumpCount === 0 ? JUMP_VY : DOUBLE_JUMP_VY)
      this.jumpCount++
    }

    // J — Ataque básico (attack1)
    this.attackCooldown = Math.max(0, this.attackCooldown - delta)
    if (Phaser.Input.Keyboard.JustDown(this.keyJ) && !this.isAttacking && !this.isTurning && this.attackCooldown === 0) {
      this.doAttack()
      this.attackCooldown = ATTACK_COOLDOWN
    }

    // K — Golpe forte / área (attack2)
    this.attack2Cooldown = Math.max(0, this.attack2Cooldown - delta)
    if (Phaser.Input.Keyboard.JustDown(this.keyK) && !this.isAttacking && this.attack2Cooldown === 0) {
      this.doAttack2()
      this.attack2Cooldown = 800
    }

    // L — Especial
    this.abilityCooldown = Math.max(0, this.abilityCooldown - delta)
    if (Phaser.Input.Keyboard.JustDown(this.keyL) && this.abilityCooldown === 0 && !this.isAttacking) {
      this.doAbility()
      this.abilityCooldown = this.abilityMaxCooldown
      this.emitHUD()
    }
    if (this.abilityCooldown > 0) this.emitHUD()

    if (!this.online) this.updateBots(delta)
    if (this.online) {
      this.syncOnline(delta)
      this.updateRemoteAnim()
    }

    // HP bar do remoto
    if (this.online && this.remotePlayer?.visible) this.drawRemoteHP()
  }

  private updateRemoteAnim() {
    if (!this.remotePlayer?.visible) return
    const isDioupe = this.remoteCharacterId === "dioupe"
    const isBW     = this.remoteCharacterId === "boletas-wolf"
    if (!isDioupe && !isBW) return
    const pfx = isDioupe ? "dioupe" : "bw"
    if (Math.abs(this.remoteVX) > 10) {
      const walkAnim = !this.remotePlayer.flipX ? `${pfx}-walk-right` : `${pfx}-walk-left`
      if (this.remotePlayer.anims.currentAnim?.key !== walkAnim) this.remotePlayer.play(walkAnim)
    } else {
      if (this.remotePlayer.anims.currentAnim?.key !== `${pfx}-idle`) this.remotePlayer.play(`${pfx}-idle`)
    }
  }

  private updateBots(delta: number) {
    const W = this.scale.width
    for (const bot of this.bots) {
      if (!bot.alive) continue
      const body = bot.sprite.body

      // Stun — paralisa o bot
      if (bot.stunTimer > 0) {
        bot.stunTimer = Math.max(0, bot.stunTimer - delta)
        body.setVelocityX(0)
        bot.nameLabel.setPosition(bot.sprite.x, bot.sprite.y - 38)
        this.drawBotHPBar(bot)
        continue
      }

      // Reverse direction at edges or on timer
      bot.dirTimer -= delta
      if (bot.dirTimer <= 0 || bot.sprite.x <= 20 || bot.sprite.x >= W - 20) {
        bot.direction *= -1
        bot.dirTimer = 1500 + Math.random() * 2000
      }

      body.setVelocityX(bot.direction * BOT_SPEED)
      bot.sprite.setFlipX(bot.direction < 0)

      // Random jump
      bot.jumpTimer -= delta
      if (bot.jumpTimer <= 0 && body.blocked.down) {
        body.setVelocityY(JUMP_VY)
        bot.jumpTimer = 2000 + Math.random() * 3000
      }

      bot.nameLabel.setPosition(bot.sprite.x, bot.sprite.y - 38)
      this.drawBotHPBar(bot)
    }
  }

  private drawBotHPBar(bot: Bot) {
    const barW = 32
    const barH = 4
    const x = bot.sprite.x - barW / 2
    const y = bot.sprite.y - 30

    bot.hpBarBg.clear()
    bot.hpBarBg.fillStyle(0x1a1a2e)
    bot.hpBarBg.fillRect(x, y, barW, barH)

    bot.hpBar.clear()
    const pct = Math.max(0, bot.hp / bot.maxHp)
    const color = pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xf97316 : 0xef4444
    bot.hpBar.fillStyle(color)
    bot.hpBar.fillRect(x, y, barW * pct, barH)
  }

  private doAttack2() {
    const isAnimChar = this.characterId === "dioupe" || this.characterId === "boletas-wolf"
    const pfx = this.characterId === "dioupe" ? "dioupe" : "bw"

    if (!isAnimChar) {
      // Golpe forte para personagens sem sprite animado
      const dir = this.player.flipX ? -1 : 1
      this.player.setTint(0xff8800)
      this.time.delayedCall(150, () => this.player.clearTint())
      for (const bot of this.bots) {
        if (!bot.alive) continue
        const dx = Math.abs(bot.sprite.x - this.player.x)
        const dy = Math.abs(bot.sprite.y - this.player.y)
        if (dx < 80 && dy < 80) this.hitBot(bot, 35)
      }
      if (this.online) getActiveRoom()?.send("attack", { type: "strong" })
      return
    }

    this.isAttacking = true
    this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
    this.player.play(`${pfx}-attack2`)
    this.player.setFlipX(this.facingLeft)
    this.time.delayedCall(ATTACK_POINT_MS, () => {
      if (!this.isAttacking) return
      this.applyAttackDamage()
      if (this.online) getActiveRoom()?.send("attack", { type: "strong" })
    })
    const finish2 = () => {
      this.isAttacking = false
      this.player.play(`${pfx}-idle`)
      this.player.setFlipX(!this.facingLeft)
    }
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finish2)
    this.time.delayedCall(2000, () => { if (this.isAttacking) finish2() })
  }

  private doAttack() {
    if (this.characterId === "dioupe" || this.characterId === "boletas-wolf") {
      const pfx = this.characterId === "dioupe" ? "dioupe" : "bw";
      const wantLeft = this.facingLeft
      const needsTurn = wantLeft !== this.facingLeft

      const executeAttack = () => {
        this.isTurning = false
        this.isAttacking = true
        const atkAnim = this.facingLeft ? `${pfx}-attack-left` : `${pfx}-attack-right`
        const hasAnim = this.anims.exists(atkAnim)

        this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)

        if (hasAnim) {
          this.player.play(atkAnim)
        } else {
          this.player.play(`${pfx}-idle`)
        }
        this.player.setFlipX(false)

        this.time.delayedCall(ATTACK_POINT_MS, () => {
          if (!this.isAttacking) return
          this.applyAttackDamage()
          if (this.online) getActiveRoom()?.send("attack", { type: "basic" })
        })

        this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.isAttacking = false
          this.player.play(`${pfx}-idle`)
          this.player.setFlipX(!this.facingLeft)
        })
      }

      if (needsTurn) {
        // Turn rate — vira antes de atacar
        this.isTurning = true
        this.facingLeft = wantLeft
        this.time.delayedCall(TURN_DELAY, executeAttack)
      } else {
        executeAttack()
      }
    } else {
      this.player.setTint(0xffffff)
      this.time.delayedCall(80, () => this.player.clearTint())
    }

    // Slash visual (dev only)
    if (SHOW_ATTACK_FX) {
      const dir = (this.characterId === "dioupe" ? this.facingLeft : this.player.flipX) ? -1 : 1
      const slash = this.add.graphics()
      slash.lineStyle(3, 0xf0f4ff, 0.9)
      slash.strokeEllipse(this.player.x + dir * 40, this.player.y, 60, 30)
      slash.setDepth(15)
      this.time.delayedCall(150, () => slash.destroy())
    }

    // Para personagens sem sprite animado o dano é imediato
    if (this.characterId !== "dioupe") {
      for (const bot of this.bots) {
        if (!bot.alive) continue
        const dx = Math.abs(bot.sprite.x - this.player.x)
        const dy = Math.abs(bot.sprite.y - this.player.y)
        if (dx < ATTACK_RANGE_X && dy < ATTACK_RANGE_Y) this.hitBot(bot, ATTACK_DAMAGE)
      }
    }
  }

  private applyAttackDamage() {
    if (SHOW_ATTACK_FX) {
      const dir = this.facingLeft ? -1 : 1
      const slash = this.add.graphics()
      slash.lineStyle(4, 0xfbbf24, 1)
      slash.strokeEllipse(this.player.x + dir * 45, this.player.y, 70, 35)
      slash.setDepth(15)
      this.time.delayedCall(120, () => slash.destroy())
    }

    for (const bot of this.bots) {
      if (!bot.alive) continue
      const dx = Math.abs(bot.sprite.x - this.player.x)
      const dy = Math.abs(bot.sprite.y - this.player.y)
      if (dx < ATTACK_RANGE_X && dy < ATTACK_RANGE_Y) this.hitBot(bot, ATTACK_DAMAGE)
    }
  }

  private hitBot(bot: Bot, damage: number) {
    bot.hp = Math.max(0, bot.hp - damage)

    // Floating damage number
    const dmgText = this.add
      .text(bot.sprite.x, bot.sprite.y - 20, `-${damage}`, {
        fontSize: "14px",
        color: "#ef4444",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20)
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => dmgText.destroy(),
    })

    // Knockback
    const kbDir = bot.sprite.x >= this.player.x ? 1 : -1
    bot.sprite.body.setVelocityX(kbDir * 260)

    // Flash red
    bot.sprite.setTint(0xff4444)
    this.time.delayedCall(150, () => bot.sprite.clearTint())

    if (bot.hp <= 0) this.killBot(bot)
  }

  private killBot(bot: Bot) {
    bot.alive = false
    bot.sprite.body.setVelocityX(0)

    this.tweens.add({
      targets: [bot.sprite, bot.nameLabel],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        bot.sprite.destroy()
        bot.nameLabel.destroy()
        bot.hpBar.destroy()
        bot.hpBarBg.destroy()
      },
    })

    const aliveBots = this.bots.filter((b) => b.alive)
    if (aliveBots.length === 0) {
      this.time.delayedCall(800, () => {
        this.scene.start("ResultScene", {
          winner: this.nickname,
          characterId: this.characterId,
        })
      })
    }
  }

  private triggerBWFlash() {
    const W = this.scale.width
    const H = this.scale.height

    // Sprite de flash centralizado e escalado para cobrir a tela
    const flash = this.add.sprite(W / 2, H / 2, "bw-flash-skill")
    const scale = Math.max(W, H) / 128 * 1.2
    flash.setScale(scale)
    flash.setDepth(50)
    flash.setScrollFactor(0)
    flash.play("bw-flash-skill")
    flash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy(),
      })
    })

    // Stun em todos os bots
    for (const bot of this.bots) {
      if (!bot.alive) continue
      bot.stunTimer = 3000
      bot.sprite.setTint(0xffdd44)
      this.time.delayedCall(3000, () => { if (bot.alive) bot.sprite.clearTint() })
    }
  }

  private spawnProjectile(facingLeft: boolean) {
    const dir = facingLeft ? -1 : 1
    const spawnX = this.player.x + dir * 60
    const spawnY = this.player.y - 10
    const side = facingLeft ? "left" : "right"

    const proj = this.physics.add.sprite(spawnX, spawnY, `dioupe-power-${side}`)
    proj.setScale(0.75)
    proj.setDepth(9)
    this.projectiles.add(proj)
    proj.body.setAllowGravity(false)
    proj.body.setVelocityX(dir * 180)
    proj.body.setVelocityY(0)

    // Intro → travel loop
    proj.play(`dioupe-power-${side}-intro`)
    proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (proj.active) proj.play(`dioupe-power-${side}-travel`)
    })

    const onHit = (bot: Bot) => {
      if (!proj.active) return
      proj.body.setVelocityX(0)
      proj.play(`dioupe-power-${side}-impact`)
      proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (proj.active) proj.destroy()
      })
      this.hitBot(bot, 60)
    }

    for (const bot of this.bots) {
      if (!bot.alive) continue
      this.physics.add.overlap(proj, bot.sprite, () => onHit(bot))
    }

    this.time.delayedCall(4000, () => { if (proj.active) proj.destroy() })
  }

  private doAbility() {
    switch (this.characterId) {
      case "boletas-wolf": {
        this.isAttacking = true
        const bwFacing = this.facingLeft
        const bwAnim = bwFacing ? "bw-special-left" : "bw-special-right"
        this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
        this.player.play(bwAnim)
        this.player.setFlipX(false)
        const finishBW = () => {
          this.isAttacking = false
          this.triggerBWFlash()
          if (this.online) getActiveRoom()?.send("attack", { type: "special" })
        }
        this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finishBW)
        this.time.delayedCall(3000, () => { if (this.isAttacking) finishBW() })
        break
      }
      case "dioupe": {
        this.isAttacking = true
        const facingLeft = this.facingLeft
        const specialAnim = facingLeft ? "dioupe-special-left" : "dioupe-special-right"
        this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
        this.player.play(specialAnim)
        this.player.setFlipX(false)
        const finishDioupe = () => {
          this.spawnProjectile(facingLeft)
          this.isAttacking = false
          if (this.online) getActiveRoom()?.send("attack", { type: "special" })
        }
        this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finishDioupe)
        this.time.delayedCall(3000, () => { if (this.isAttacking) finishDioupe() })
        break
      }
      case "ana": {
        const dir = this.player.flipX ? -1 : 1
        this.player.x += dir * 160
        this.player.setTint(0xa855f7)
        this.time.delayedCall(150, () => this.player.clearTint())
        if (this.online) getActiveRoom()?.send("ability")
        break
      }
      case "pedro": {
        this.player.body.setVelocityY(-900)
        this.jumpCount = 0
        this.player.setTint(0x22c55e)
        this.time.delayedCall(200, () => this.player.clearTint())
        if (this.online) getActiveRoom()?.send("ability")
        break
      }
      case "deco": {
        this.shielded = true
        this.player.setTint(0xf97316)
        this.time.delayedCall(3000, () => {
          this.shielded = false
          this.player.clearTint()
        })
        if (this.online) getActiveRoom()?.send("ability")
        break
      }
    }
  }

  private emitHUD() {
    this.onHUDUpdate?.({
      hp: this.hp,
      maxHp: this.maxHp,
      abilityCooldown: this.abilityCooldown,
      abilityMaxCooldown: this.abilityMaxCooldown,
    })
  }
}
