"use client"

import { useEffect, useState } from "react"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(5,7,15,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(14,165,233,0.08)" : "1px solid transparent",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1024px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "16px clamp(1rem, 5vw, 2rem)",
        }}
      >
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          dioupe
          <span style={{ color: "var(--accent-primary)" }}>·</span>
        </span>
      </div>
    </nav>
  )
}
