import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "dioupe — Ferramentas que eu uso",
  description:
    "Apps construídos para resolver problemas reais — direto ao ponto, sem frescura.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={geist.className}>
      <body>{children}</body>
    </html>
  )
}
