import Navbar from "@/components/Navbar"
import HeroSection from "@/components/HeroSection"
import AppsSection from "@/components/AppsSection"
import HowItWorks from "@/components/HowItWorks"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main className="w-full">
      <Navbar />
      <HeroSection />
      <AppsSection />
      <HowItWorks />
      <Footer />
    </main>
  )
}
