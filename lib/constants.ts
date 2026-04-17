export const DOWNLOADS = {
  android: "https://github.com/joaohenriquefsp/DioupeCamApp-/releases/download/v1.0.0/DioupeCam.apk",
  windows: "https://github.com/joaohenriquefsp/DioupeCamDesktop/releases/download/v1.0.0/DioupeCamDesktop-Setup.exe",
}

export const APPS = [
  {
    id: "dioupecam-android",
    title: "DioupeCam",
    platform: "Android",
    icon: "camera" as const,
    description:
      "Transforma a câmera do seu celular em uma webcam profissional. Conecte via USB ou WiFi e use no Discord, OBS, Teams e Zoom.",
    features: [
      "Stream H.264 de alta qualidade",
      "Conexão USB (baixíssima latência) ou WiFi",
      "Compatível com qualquer app de videochamada",
    ],
    downloadLabel: "Download APK",
    downloadUrl: DOWNLOADS.android,
    info: "Android 8.0+  ·  Grátis",
  },
  {
    id: "dioupecam-desktop",
    title: "DioupeCam Desktop",
    platform: "Windows",
    icon: "monitor" as const,
    description:
      "Recebe o stream do DioupeCam e expõe como câmera virtual no Windows. Funciona com Discord, OBS, Teams, Zoom e qualquer app.",
    features: [
      "Câmera virtual DirectShow nativa",
      "Preview ao vivo na interface",
      "FFmpeg e driver inclusos no instalador",
    ],
    downloadLabel: "Download Setup.exe",
    downloadUrl: DOWNLOADS.windows,
    info: "Windows 10+  ·  Grátis",
  },
]
