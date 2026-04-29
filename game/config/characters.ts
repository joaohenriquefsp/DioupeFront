export interface AbilityConfig {
  name: string
  description: string
  cooldown: number
}

export interface CharacterConfig {
  id: string
  name: string
  color: number
  hp: number
  speed: number
  damage: number
  power: number
  description: string
  gang: string
  personality: string
  quote: string
  ability: AbilityConfig
}

export const CHARACTERS: CharacterConfig[] = [
  {
    id: "dioupe",
    name: "Dioupe",
    color: 0x38bdf8,
    hp: 120,
    speed: 200,
    damage: 75,
    power: 90,
    gang: "Punkster Programming",
    personality: "Calmo, mas cuidado com o Bastão Paiol!",
    quote: "\"Criador do Jogo, o mais forte, Dono da praça da Matriz, Melhor doteiro de Passos MG e Região\"",
    description: "Rápido como o Wi-Fi na madrugada",
    ability: {
      name: "Fumaça",
      description: "Lança um projétil de fumaça que causa dano em linha reta",
      cooldown: 5000,
    },
  },
  {
    id: "deco",
    name: "Deco",
    color: 0xf97316,
    hp: 160,
    speed: 170,
    damage: 80,
    power: 65,
    gang: "Punkster Communist e Criador de Gatos",
    personality: "Gosta de Gatos, parceiro e faz piadas engraçadas porém repetitivas!",
    quote: "\"BoddyBuilder é o foco, quase morri por isso\"",
    description: "O gato mais forte do lobby",
    ability: {
      name: "Escudo",
      description: "Bloqueia o próximo ataque recebido",
      cooldown: 8000,
    },
  },
  {
    id: "boletas-wolf",
    name: "BoletasWolf",
    color: 0xdc2626,
    hp: 140,
    speed: 185,
    damage: 85,
    power: 75,
    gang: "Punkster Programming",
    personality: "Guerreiro nato. Sério nas batalhas, leal aos aliados.",
    quote: "\"Todo lobo tem sua hora.\"",
    description: "O lobo da praça — feroz e implacável",
    ability: {
      name: "Especial",
      description: "Ataque especial devastador",
      cooldown: 5000,
    },
  },
  {
    id: "ana",
    name: "Ana",
    color: 0xa855f7,
    hp: 90,
    speed: 240,
    damage: 65,
    power: 85,
    gang: "Fantasmas",
    personality: "Traiçoeira e imprevisível. Nunca está onde parece.",
    quote: "\"Pisca e eu já fui.\"",
    description: "A mais rápida do lobby — e a mais traiçoeira",
    ability: {
      name: "Teleporte",
      description: "Teleporta para a direção que está olhando",
      cooldown: 4000,
    },
  },
  {
    id: "pedro",
    name: "Pedro",
    color: 0x22c55e,
    hp: 150,
    speed: 190,
    damage: 80,
    power: 70,
    gang: "Os Donos da Praça",
    personality: "Equilibrado. Faz tudo bem, nada perfeito.",
    quote: "\"Cada salto é um recomeço.\"",
    description: "Equilíbrio perfeito entre força e mobilidade",
    ability: {
      name: "Salto Turbo",
      description: "Super pulo que atinge plataformas inacessíveis",
      cooldown: 6000,
    },
  },
]

export const getCharacter = (id: string): CharacterConfig | undefined =>
  CHARACTERS.find((c) => c.id === id)
