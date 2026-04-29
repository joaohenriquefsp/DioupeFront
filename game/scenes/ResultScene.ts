import * as Phaser from "phaser"

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: "ResultScene" })
  }

  init(data: { winner?: string; characterId?: string }) {
    // Redirect to the Next.js result page
    if (typeof window !== "undefined") {
      const params = new URLSearchParams({
        winner: data.winner ?? "Ninguém",
        character: data.characterId ?? "",
      })
      window.location.href = `/result?${params.toString()}`
    }
  }

  create() {}
}
