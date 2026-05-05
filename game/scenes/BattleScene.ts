import * as Phaser from "phaser"
import { CHARACTERS, getCharacter } from "../config/characters"
import { CharacterSheet, getSheet } from "../config/characterSheets"
import { getActiveRoom, clearActiveRoom } from "../../lib/gameRoom"

const SPEED = 200
const JUMP_VY = -500
const DOUBLE_JUMP_VY = -440
const ATTACK_COOLDOWN = 400
const BOT_SPEED = 110
const GRAVITY_EXTRA = 700
const SHOW_ATTACK_FX = process.env.NODE_ENV === "development"

// Frame data por tipo de ataque (startup = ms até janela de hit)
const ATTACK_FPS = 7
const ATTACK_POINT_FRAME = 1
const ATTACK_POINT_MS = (ATTACK_POINT_FRAME / ATTACK_FPS) * 1000  // ~143ms

interface AttackData {
  startup: number
  damage: number
  rangeX: number
  rangeY: number
  recovery: number
}

const ATTACK_DATA: Record<"basic" | "strong" | "special", AttackData> = {
  basic:  { startup: ATTACK_POINT_MS,      damage: 20, rangeX: 65,   rangeY: 60,   recovery: 220 },
  strong: { startup: ATTACK_POINT_MS + 60, damage: 35, rangeX: 80,   rangeY: 80,   recovery: 380 },
  special:{ startup: 0,                    damage: 60, rangeX: 9999, rangeY: 9999, recovery: 0 },
}

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

  private jumpCount = 0
  private readonly MAX_JUMPS = 2
  private attackCooldown = 0
  private attack2Cooldown = 0
  private abilityCooldown = 0
  private abilityMaxCooldown = 5000
  private shielded = false

  private hp = 100
  private maxHp = 100
  private characterId = "dioupe"
  private sheet!: CharacterSheet
  private nickname = "Player"
  private facingLeft = false

  // Estado de combate
  private isAttacking = false
  private isUsingAbility = false        // previne K de cancelar especial
  private attackSafetyId = 0           // geração por ataque — invalida safeties antigas
  private recoveryTimer = 0
  private playerStunTimer = 0          // stun recebido do flash-stun do BW inimigo
  private queuedAttack: "basic" | "strong" | null = null
  private hitBotsThisAttack = new Set<Bot>()

  private nameLabel!: Phaser.GameObjects.Text
  private bots: Bot[] = []
  private onHUDUpdate?: (data: HUDData) => void
  private projectiles!: Phaser.Physics.Arcade.Group
  private online = false
  private remotePlayer?: Phaser.GameObjects.Sprite
  private remoteNameLabel?: Phaser.GameObjects.Text
  private remoteHPBar?: Phaser.GameObjects.Graphics
  private remoteHPBarBg?: Phaser.GameObjects.Graphics
  private remoteHP = 100
  private remoteMaxHP = 100
  private remoteDead = false
  private remoteCharacterId = ""
  private remoteVX = 0
  private remoteFacingLeft = false     // direção real do remoto (separada do flipX)
  private syncTimer = 0
  private remoteTargetX = 0
  private remoteTargetY = 0
  private remoteIsAttacking = false

  constructor() {
    super({ key: "BattleScene" })
  }

  init(data: { characterId?: string; nickname?: string; online?: boolean; onHUDUpdate?: (d: HUDData) => void }) {
    this.characterId = data.characterId ?? "dioupe"
    this.sheet       = getSheet(this.characterId)
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
    loadBW("bw-idle",          "idle.png",          128)
    loadBW("bw-walk-left",     "walk-left.png",     128)
    loadBW("bw-walk-right",    "walk-right.png",    128)
    loadBW("bw-attack-right",  "attack-right.png",  128)
    loadBW("bw-attack-left",   "attack-left.png",   128)
    loadBW("bw-attack2",       "attack2.png",       128)
    loadBW("bw-special-left",  "special-left.png",  128)
    loadBW("bw-special-right", "special-right.png", 128)
    loadBW("bw-flash-skill",   "flash-skill.png",   128)
    loadBW("bw-crouch-left",   "crouch-left.png",   128)
    loadBW("bw-crouch-right",  "crouch-right.png",  128)
    loadBW("bw-hurt-left",     "hurt-left.png",     128)
    loadBW("bw-hurt-right",    "hurt-right.png",    128)
    loadBW("bw-jump-left",     "jump-left.png",     128)
    loadBW("bw-jump-right",    "jump-right.png",    128)
  }

  create() {
    // Sempre re-registra animações para garantir start/end corretos entre sessions
    const reg = (key: string, tex: string, end: number, fps: number, loop: boolean, start = 0) => {
      if (this.anims.exists(key)) this.anims.remove(key)
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start, end }), frameRate: fps, repeat: loop ? -1 : 0 })
    }
    reg("dioupe-idle",          "dioupe-idle",          7, 8,  true)
    reg("dioupe-walk-left",     "dioupe-walk-left",     7, 8,  true)
    reg("dioupe-walk-right",    "dioupe-walk-right",    7, 8,  true)
    reg("dioupe-attack-right",  "dioupe-attack-right",  3, 7,  false)
    reg("dioupe-attack-left",   "dioupe-attack-left",   4, 7,  false, 1)  // frame 0 transparente
    reg("dioupe-attack2",       "dioupe-attack2",       4, 7,  false)
    reg("dioupe-special-left",  "dioupe-special-left",  8, 6,  false)
    reg("dioupe-special-right", "dioupe-special-right", 8, 6,  false)

    reg("bw-idle",          "bw-idle",          8, 8,  true)
    reg("bw-walk-left",     "bw-walk-left",     4, 8,  true)
    reg("bw-walk-right",    "bw-walk-right",    4, 8,  true)
    reg("bw-attack-right",  "bw-attack-right",  3, 7,  false)
    reg("bw-attack-left",   "bw-attack-left",   7, 7,  false, 4)  // frames 0-3 transparentes, conteúdo em 4-7
    reg("bw-attack2",       "bw-attack2",       3, 7,  false)
    reg("bw-special-left",  "bw-special-left",  3, 6,  false)
    reg("bw-special-right", "bw-special-right", 3, 6,  false)
    reg("bw-flash-skill",   "bw-flash-skill",   3, 8,  false)
    reg("bw-crouch-left",   "bw-crouch-left",   4, 8,  false)
    reg("bw-crouch-right",  "bw-crouch-right",  4, 8,  false)
    reg("bw-hurt-left",     "bw-hurt-left",     4, 8,  false)
    reg("bw-hurt-right",    "bw-hurt-right",    4, 8,  false)
    reg("bw-jump-left",     "bw-jump-left",     3, 8,  false)
    reg("bw-jump-right",    "bw-jump-right",    3, 8,  false)

    const regFrames = (key: string, tex: string, frames: number[], fps: number, loop: boolean) => {
      if (this.anims.exists(key)) this.anims.remove(key)
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

    const spawnX = W / 2
    const spawnY = H - 120
    const playerTexture = this.sheet.isAnimated
      ? `${this.sheet.prefix}-idle`
      : `char-${this.characterId}`
    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture)
    this.player.setCollideWorldBounds(true)
    this.player.body.setGravityY(GRAVITY_EXTRA)
    this.player.setDepth(10)
    this.player.setScale(this.sheet.scale)
    this.player.body.setSize(this.sheet.bodyW, this.sheet.bodyH)
    this.player.body.setOffset(this.sheet.offsetX, this.sheet.offsetY)
    if (this.sheet.isAnimated) this.player.play(`${this.sheet.prefix}-idle`)

    this.nameLabel = this.add
      .text(spawnX, spawnY - 36, this.nickname, {
        fontSize: "11px", color: "#f0f4ff", fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(11)

    this.physics.add.collider(this.player, this.platforms)
    this.projectiles = this.physics.add.group()

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
    if (this.syncTimer >= 50) {
      this.syncTimer = 0
      room.send("position", { x: this.player.x, y: this.player.y })
      // Envia facingRight explícito — servidor não precisa derivar de vx
      room.send("move", {
        vx: this.player.body.velocity.x,
        vy: this.player.body.velocity.y,
        facingRight: !this.facingLeft,
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
    const s = getSheet(characterId)
    const tex = s.isAnimated ? `${s.prefix}-idle` : `char-${characterId}`
    this.remotePlayer.setTexture(tex)
    this.remotePlayer.setScale(s.scale)
    if (s.isAnimated) {
      this.remotePlayer.play(`${s.prefix}-idle`)
      this.remotePlayer.setFlipX(!this.remoteFacingLeft)
    }
  }

  private setupOnline(W: number, H: number) {
    const room = getActiveRoom()
    if (!room) return

    const myId = room.sessionId

    this.remotePlayer = this.add.sprite(W / 2 + 100, H - 120, "char-dioupe")
    this.remotePlayer.setDepth(10)
    this.remotePlayer.setVisible(false)
    this.remoteCharacterId = ""

    this.remoteNameLabel = this.add.text(0, 0, "", {
      fontSize: "11px", color: "#f0f4ff", fontFamily: "monospace"
    }).setOrigin(0.5).setDepth(11).setVisible(false)

    this.remoteHPBarBg = this.add.graphics().setDepth(12)
    this.remoteHPBar   = this.add.graphics().setDepth(13)

    const initState = (room as any).state
    if (initState?.players) {
      initState.players.forEach((player: any, sessionId: string) => {
        if (sessionId !== myId && player.characterId) {
          this.remoteFacingLeft = !player.facingRight
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

        // Armazena direção real — updateRemoteAnim() aplica o flip correto
        this.remoteFacingLeft = !player.facingRight
        this.remoteNameLabel?.setText(player.nickname)
        this.remoteTargetX = player.x
        this.remoteTargetY = player.y

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

    room.onMessage("remoteAttack", (data: { sessionId: string; type: string; facingRight: boolean }) => {
      if (!this.remotePlayer?.visible) return
      const s = getSheet(this.remoteCharacterId)
      if (!s.isAnimated) return
      const pfx = s.prefix
      const facingLeft = !data.facingRight

      let anim: string
      if (data.type === "strong") {
        anim = `${pfx}-attack2`
        this.remotePlayer.setFlipX(facingLeft)
      } else if (data.type === "special") {
        anim = facingLeft ? `${pfx}-special-left` : `${pfx}-special-right`
        this.remotePlayer.setFlipX(false)
      } else {
        anim = facingLeft ? `${pfx}-attack-left` : `${pfx}-attack-right`
        this.remotePlayer.setFlipX(false)
      }

      if (!this.anims.exists(anim)) return
      // Remove listeners anteriores antes de adicionar novo
      this.remotePlayer.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
      this.remoteIsAttacking = true
      this.remotePlayer.play(anim)

      const finishRemoteAtk = () => {
        this.remoteIsAttacking = false
        if (this.remotePlayer) {
          this.remotePlayer.play(`${pfx}-idle`)
          this.remotePlayer.setFlipX(!this.remoteFacingLeft)
          // Cria o objeto visual do especial na tela de quem recebe
          if (data.type === "special") {
            const rs = getSheet(this.remoteCharacterId)
            if (rs.specialType === "flash-stun") {
              this.triggerBWFlash()
              // Stuna o jogador local por 3s
              this.playerStunTimer = 3000
              this.player.setTint(0xffdd44)
              this.time.delayedCall(3000, () => { this.player.clearTint() })
            } else if (rs.specialType === "projectile" && this.remotePlayer) {
              // Projétil remoto colide com o jogador local (tem physics body)
              this.spawnProjectileAt(!data.facingRight, this.remotePlayer.x, this.remotePlayer.y, false, this.player)
            }
          }
        }
      }
      this.remotePlayer.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finishRemoteAtk)
      this.time.delayedCall(1500, () => { if (this.remoteIsAttacking) finishRemoteAtk() })
    })

    room.onMessage("playerEliminated", (data: { id: string; nickname: string }) => {
      if (data.id !== myId) {
        this.time.delayedCall(800, () => {
          clearActiveRoom()
          this.scene.start("ResultScene", { winner: this.nickname, characterId: this.characterId })
        })
      }
    })

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
          fontSize: "11px", color: "#f0f4ff", fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setDepth(11)

      const hpBarBg = this.add.graphics().setDepth(12)
      const hpBar = this.add.graphics().setDepth(13)

      this.bots.push({
        sprite, hp: char.hp, maxHp: char.hp, color: char.color,
        nameLabel, hpBarBg, hpBar,
        direction: i % 2 === 0 ? 1 : -1,
        dirTimer: 2000 + Math.random() * 1500,
        jumpTimer: 1500 + Math.random() * 2000,
        alive: true, stunTimer: 0,
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
    delta = Math.min(delta, 50)

    const body = this.player.body
    const onGround = body.blocked.down
    if (onGround) this.jumpCount = 0

    this.nameLabel.setPosition(this.player.x, this.player.y - this.sheet.nameLabelOffset)

    const left  = this.cursors.left.isDown  || this.keyA.isDown
    const right = this.cursors.right.isDown || this.keyD.isDown

    // Stun (recebido do flash-stun BW) — bloqueia todos os inputs
    const isStunned = this.playerStunTimer > 0
    if (this.playerStunTimer > 0) {
      this.playerStunTimer = Math.max(0, this.playerStunTimer - delta)
      body.setVelocityX(body.velocity.x * 0.8)  // desacelera mas não trava fisica
    }

    // Movimento — bloqueado durante ataque e stun
    if (!this.isAttacking && !isStunned) {
      const { isAnimated } = this.sheet
      if (left) {
        if (isAnimated) this.facingLeft = true
        else this.player.setFlipX(true)
        body.setVelocityX(-SPEED)
      } else if (right) {
        if (isAnimated) this.facingLeft = false
        else this.player.setFlipX(false)
        body.setVelocityX(SPEED)
      } else {
        body.setVelocityX(body.velocity.x * 0.75)
      }
      if (isAnimated) this.player.setFlipX(false)
    }

    // Animação idle/walk
    const { isAnimated, prefix: pfx } = this.sheet
    if (isAnimated && !this.isAttacking && !isStunned) {
      const moving = left || right
      const currentAnim = this.player.anims.currentAnim?.key ?? ""
      if (moving) {
        const walkAnim = this.facingLeft ? `${pfx}-walk-left` : `${pfx}-walk-right`
        if (currentAnim !== walkAnim) { this.player.setFlipX(false); this.player.play(walkAnim) }
      } else {
        this.player.setFlipX(!this.facingLeft)
        if (currentAnim !== `${pfx}-idle`) this.player.play(`${pfx}-idle`)
      }
    }

    // Jump — bloqueado durante stun
    const jumpJustDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    if (jumpJustDown && this.jumpCount < this.MAX_JUMPS && !isStunned) {
      body.setVelocityY(this.jumpCount === 0 ? JUMP_VY : DOUBLE_JUMP_VY)
      this.jumpCount++
    }

    // Recovery timer — bloqueia ataques, aceita input buffer
    if (this.recoveryTimer > 0) {
      this.recoveryTimer = Math.max(0, this.recoveryTimer - delta)
      if (this.recoveryTimer === 0 && this.queuedAttack) {
        const queued = this.queuedAttack
        this.queuedAttack = null
        this.triggerAttack(queued)
        if (queued === "basic") this.attackCooldown = ATTACK_COOLDOWN
        else this.attack2Cooldown = 800
      }
    }

    // J — Ataque básico (bloqueado durante stun)
    this.attackCooldown = Math.max(0, this.attackCooldown - delta)
    if (Phaser.Input.Keyboard.JustDown(this.keyJ) && !this.isAttacking && !isStunned && this.attackCooldown === 0) {
      if (this.recoveryTimer > 0) {
        this.queuedAttack = "basic"
      } else {
        this.triggerAttack("basic")
        this.attackCooldown = ATTACK_COOLDOWN
      }
    }

    // K — Golpe forte (bloqueado durante stun)
    this.attack2Cooldown = Math.max(0, this.attack2Cooldown - delta)
    if (Phaser.Input.Keyboard.JustDown(this.keyK) && this.attack2Cooldown === 0 && !isStunned) {
      if (this.isAttacking && !this.isUsingAbility) {
        // Cancela J — SF-style cancel
        this.isAttacking = false
        this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
        this.triggerAttack("strong")
        this.attack2Cooldown = 800
      } else if (this.recoveryTimer > 0) {
        this.queuedAttack = "strong"
      } else if (!this.isAttacking) {
        this.triggerAttack("strong")
        this.attack2Cooldown = 800
      }
    }

    // L — Especial (bloqueado durante stun)
    this.abilityCooldown = Math.max(0, this.abilityCooldown - delta)
    if (Phaser.Input.Keyboard.JustDown(this.keyL) && this.abilityCooldown === 0 && !this.isAttacking && !isStunned) {
      if (this.online) {
        const room = getActiveRoom()
        if (this.sheet.specialType === "projectile") {
          // Projétil: só anima o inimigo — dano enviado quando o projétil bater
          room?.send("specialAnim", { facingRight: !this.facingLeft })
        } else if (this.sheet.specialType === "flash-stun") {
          // Stun: sem dano — só anima o inimigo
          room?.send("specialAnim", { facingRight: !this.facingLeft })
        }
        // teleport / super-jump / shield: efeito local, sem servidor
      }
      this.doAbility()
      this.abilityCooldown = this.abilityMaxCooldown
      this.emitHUD()
    }
    if (this.abilityCooldown > 0) this.emitHUD()

    if (!this.online) this.updateBots(delta)
    if (this.online) {
      this.syncOnline(delta)
      this.updateRemotePos(delta)
      this.updateRemoteAnim()
    }

    if (this.online && this.remotePlayer?.visible) this.drawRemoteHP()
  }

  // Dispara ataque com frame data — J, K e input buffer
  private triggerAttack(type: "basic" | "strong") {
    const data = ATTACK_DATA[type]
    const { isAnimated, prefix: pfx } = this.sheet

    ;(this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(0)
    this.hitBotsThisAttack.clear()
    this.isUsingAbility = false
    const myId = ++this.attackSafetyId

    if (!isAnimated) {
      this.player.setTint(type === "basic" ? 0xffffff : 0xff8800)
      this.time.delayedCall(80, () => this.player.clearTint())
      if (this.online) {
        getActiveRoom()?.send("attack", { type, facingRight: !this.facingLeft })
      }
      for (const bot of this.bots) {
        if (!bot.alive || this.hitBotsThisAttack.has(bot)) continue
        const dx = Math.abs(bot.sprite.x - this.player.x)
        const dy = Math.abs(bot.sprite.y - this.player.y)
        if (dx < data.rangeX && dy < data.rangeY) {
          this.hitBotsThisAttack.add(bot)
          this.hitBot(bot, data.damage)
        }
      }
      return
    }

    this.isAttacking = true

    const anim = type === "basic"
      ? (this.facingLeft ? `${pfx}-attack-left` : `${pfx}-attack-right`)
      : `${pfx}-attack2`

    if (!this.anims.exists(anim)) { this.isAttacking = false; return }

    this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
    this.player.off(Phaser.Animations.Events.ANIMATION_UPDATE)
    this.player.play(anim)
    this.player.setFlipX(type === "strong" ? this.facingLeft : false)

    // Online: avisa inimigo para começar a animação — dano só no último frame
    if (this.online) {
      getActiveRoom()?.send("animOnly", { type, facingRight: !this.facingLeft })
    }

    const capturedFacing = this.facingLeft
    let damageApplied = false

    // Dano exatamente no último frame (ANIMATION_UPDATE detecta quando o frame final começa)
    const applyDamage = () => {
      if (damageApplied) return
      damageApplied = true
      if (!this.online) {
        for (const bot of this.bots) {
          if (!bot.alive || this.hitBotsThisAttack.has(bot)) continue
          const dx = Math.abs(bot.sprite.x - this.player.x)
          const dy = Math.abs(bot.sprite.y - this.player.y)
          if (dx < data.rangeX && dy < data.rangeY) {
            this.hitBotsThisAttack.add(bot)
            this.hitBot(bot, data.damage)
          }
        }
        if (SHOW_ATTACK_FX) {
          const dir = capturedFacing ? -1 : 1
          const slash = this.add.graphics()
          slash.lineStyle(4, 0xfbbf24, 1)
          slash.strokeEllipse(this.player.x + dir * 45, this.player.y, 70, 35)
          slash.setDepth(15)
          this.time.delayedCall(120, () => slash.destroy())
        }
      }
      if (this.online) {
        getActiveRoom()?.send("attack", { type, facingRight: !capturedFacing })
      }
    }

    const onUpdate = (_anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (!frame.nextFrame) applyDamage()
    }
    this.player.on(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate)

    const finishAtk = () => {
      this.player.off(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate)
      applyDamage() // safety: garante dano caso ANIMATION_UPDATE não tenha disparado
      this.isAttacking = false
      this.player.play(`${pfx}-idle`)
      this.player.setFlipX(!this.facingLeft)
      this.recoveryTimer = data.recovery
    }

    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finishAtk)
    const safetyMs = type === "basic" ? 1000 : 1200
    this.time.delayedCall(safetyMs, () => {
      if (this.isAttacking && this.attackSafetyId === myId) finishAtk()
    })
  }

  private updateRemotePos(delta: number) {
    if (!this.remotePlayer?.visible) return
    const dx = this.remoteTargetX - this.remotePlayer.x
    const dy = this.remoteTargetY - this.remotePlayer.y
    if (Math.abs(dx) > 200 || Math.abs(dy) > 200) {
      this.remotePlayer.setPosition(this.remoteTargetX, this.remoteTargetY)
    } else {
      const f = Math.min(1, delta * 0.012)
      this.remotePlayer.x += dx * f
      this.remotePlayer.y += dy * f
    }
    this.remoteNameLabel?.setPosition(this.remotePlayer.x, this.remotePlayer.y - 40)
  }

  private updateRemoteAnim() {
    if (!this.remotePlayer?.visible) return
    if (this.remoteIsAttacking) return
    const s = getSheet(this.remoteCharacterId)
    if (!s.isAnimated) return
    const pfx = s.prefix
    const currentAnim = this.remotePlayer.anims.currentAnim?.key ?? ""
    if (Math.abs(this.remoteVX) > 10) {
      // Walk: usa remoteFacingLeft para selecionar animação (sprites têm direção própria)
      const walkAnim = this.remoteFacingLeft ? `${pfx}-walk-left` : `${pfx}-walk-right`
      if (currentAnim !== walkAnim) { this.remotePlayer.setFlipX(false); this.remotePlayer.play(walkAnim) }
    } else {
      // Idle: espelha lógica local — setFlipX(!facingLeft) para sprite left-facing por padrão
      this.remotePlayer.setFlipX(!this.remoteFacingLeft)
      if (currentAnim !== `${pfx}-idle`) this.remotePlayer.play(`${pfx}-idle`)
    }
  }

  private updateBots(delta: number) {
    const W = this.scale.width
    for (const bot of this.bots) {
      if (!bot.alive) continue
      const body = bot.sprite.body

      if (bot.stunTimer > 0) {
        bot.stunTimer = Math.max(0, bot.stunTimer - delta)
        body.setVelocityX(0)
        bot.nameLabel.setPosition(bot.sprite.x, bot.sprite.y - 38)
        this.drawBotHPBar(bot)
        continue
      }

      bot.dirTimer -= delta
      if (bot.dirTimer <= 0 || bot.sprite.x <= 20 || bot.sprite.x >= W - 20) {
        bot.direction *= -1
        bot.dirTimer = 1500 + Math.random() * 2000
      }

      body.setVelocityX(bot.direction * BOT_SPEED)
      bot.sprite.setFlipX(bot.direction < 0)

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
    const barW = 32, barH = 4
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

  private hitBot(bot: Bot, damage: number) {
    bot.hp = Math.max(0, bot.hp - damage)

    const dmgText = this.add
      .text(bot.sprite.x, bot.sprite.y - 20, `-${damage}`, {
        fontSize: "14px", color: "#ef4444", fontFamily: "monospace", fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20)
    this.tweens.add({
      targets: dmgText, y: dmgText.y - 30, alpha: 0, duration: 600,
      onComplete: () => dmgText.destroy(),
    })

    const kbDir = bot.sprite.x >= this.player.x ? 1 : -1
    bot.sprite.body.setVelocityX(kbDir * 260)
    bot.sprite.setTint(0xff4444)
    this.time.delayedCall(150, () => bot.sprite.clearTint())

    if (bot.hp <= 0) this.killBot(bot)
  }

  private killBot(bot: Bot) {
    bot.alive = false
    bot.sprite.body.setVelocityX(0)

    this.tweens.add({
      targets: [bot.sprite, bot.nameLabel],
      alpha: 0, duration: 500,
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
        this.scene.start("ResultScene", { winner: this.nickname, characterId: this.characterId })
      })
    }
  }

  private triggerBWFlash() {
    const W = this.scale.width
    const H = this.scale.height

    const flash = this.add.sprite(W / 2, H / 2, "bw-flash-skill")
    flash.setScale(Math.max(W, H) / 128 * 1.2)
    flash.setDepth(50)
    flash.setScrollFactor(0)
    flash.play("bw-flash-skill")
    flash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() })
    })

    for (const bot of this.bots) {
      if (!bot.alive) continue
      bot.stunTimer = 3000
      bot.sprite.setTint(0xffdd44)
      this.time.delayedCall(3000, () => { if (bot.alive) bot.sprite.clearTint() })
    }
  }

  private spawnProjectile(facingLeft: boolean) {
    // Local: colide com bots (solo) ou com remotePlayer via distance check (online)
    this.spawnProjectileAt(facingLeft, this.player.x, this.player.y, true, null)
  }

  // target: null = solo/bots | Sprite = projétil remoto colide com esse sprite (physics)
  private spawnProjectileAt(
    facingLeft: boolean,
    originX: number,
    originY: number,
    withBotHit = false,
    target: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null
  ) {
    const dir = facingLeft ? -1 : 1
    const side = facingLeft ? "left" : "right"

    const proj = this.physics.add.sprite(
      originX + dir * 60,
      originY - 10,
      `dioupe-power-${side}`
    )
    proj.setScale(0.75)
    proj.setDepth(9)
    this.projectiles.add(proj)
    proj.body.setAllowGravity(false)
    proj.body.setVelocityX(dir * 45)
    proj.body.setVelocityY(0)

    proj.play(`dioupe-power-${side}-intro`)
    proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (proj.active) proj.play(`dioupe-power-${side}-travel`)
    })

    const playImpact = () => {
      if (!proj.active) return
      proj.body.setVelocityX(0)
      proj.play(`dioupe-power-${side}-impact`)
      proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (proj.active) proj.destroy()
      })
    }

    if (withBotHit) {
      // Solo: overlap com bots
      for (const bot of this.bots) {
        if (!bot.alive) continue
        this.physics.add.overlap(proj, bot.sprite, () => {
          if (!proj.active) return
          playImpact()
          this.hitBot(bot, 60)
        })
      }

      // Online: distance check vs remotePlayer (sem physics body)
      if (this.online && this.remotePlayer) {
        const remoteRef = this.remotePlayer
        const capturedFacing = facingLeft
        const checker = this.time.addEvent({
          delay: 16,
          loop: true,
          callback: () => {
            if (!proj.active) { checker.destroy(); return }
            if (!remoteRef.visible) return
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, remoteRef.x, remoteRef.y)
            if (dist < 40) {
              checker.destroy()
              playImpact()
              // Dano enviado APENAS quando o projétil bate, não no keypress
              getActiveRoom()?.send("attack", { type: "special", facingRight: !capturedFacing })
            }
          },
        })
      }
    }

    // Projétil remoto: target tem physics body → overlap direto
    if (target) {
      this.physics.add.overlap(proj, target, () => {
        if (!proj.active) return
        playImpact()
      })
    }

    // Destrói quando sair dos limites do mapa (sem timeout artificial)
    const mapW = this.scale.width
    const boundsCheck = this.time.addEvent({
      delay: 32,
      loop: true,
      callback: () => {
        if (!proj.active) { boundsCheck.destroy(); return }
        if (proj.x < -128 || proj.x > mapW + 128) {
          boundsCheck.destroy()
          proj.destroy()
        }
      },
    })
  }

  private doAbility() {
    ;(this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(0)
    // Invalida safeties pendentes de J/K para não interromper o especial
    ++this.attackSafetyId
    const myId = this.attackSafetyId

    const { prefix: pfx, specialType } = this.sheet
    switch (specialType) {
      case "flash-stun": {
        this.isAttacking = true
        this.isUsingAbility = true
        const facing = this.facingLeft
        const anim = facing ? `${pfx}-special-left` : `${pfx}-special-right`
        this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
        this.player.play(anim)
        this.player.setFlipX(false)
        const finish = () => {
          this.isAttacking = false
          this.isUsingAbility = false
          this.triggerBWFlash()
          this.recoveryTimer = ATTACK_DATA.special.recovery
        }
        this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finish)
        this.time.delayedCall(3000, () => {
          if (this.isAttacking && this.attackSafetyId === myId) finish()
        })
        break
      }
      case "projectile": {
        this.isAttacking = true
        this.isUsingAbility = true
        const facingLeft = this.facingLeft
        const anim = facingLeft ? `${pfx}-special-left` : `${pfx}-special-right`
        this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE)
        this.player.play(anim)
        this.player.setFlipX(false)
        const finish = () => {
          this.spawnProjectile(facingLeft)
          this.isAttacking = false
          this.isUsingAbility = false
          this.recoveryTimer = ATTACK_DATA.special.recovery
        }
        this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finish)
        this.time.delayedCall(3000, () => {
          if (this.isAttacking && this.attackSafetyId === myId) finish()
        })
        break
      }
      case "teleport": {
        const dir = this.player.flipX ? -1 : 1
        this.player.x += dir * 160
        this.player.setTint(0xa855f7)
        this.time.delayedCall(150, () => this.player.clearTint())
        break
      }
      case "super-jump": {
        this.player.body.setVelocityY(-900)
        this.jumpCount = 0
        this.player.setTint(0x22c55e)
        this.time.delayedCall(200, () => this.player.clearTint())
        break
      }
      case "shield": {
        this.shielded = true
        this.player.setTint(0xf97316)
        this.time.delayedCall(3000, () => {
          this.shielded = false
          this.player.clearTint()
        })
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
