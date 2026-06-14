import dynamic from 'next/dynamic'
import { Nav } from '@/components/Nav'
import { Hero } from '@/components/Hero'
import { StatsBar } from '@/components/StatsBar'
import { Features } from '@/components/Features'
import { Rails } from '@/components/Rails'
import { HowItWorks } from '@/components/HowItWorks'
import { Pricing } from '@/components/Pricing'
import { CTA } from '@/components/CTA'
import { ContactForm } from '@/components/ContactForm'
import { Footer } from '@/components/Footer'

const LiveDemo = dynamic(() => import('@/components/LiveDemo'), {
  loading: () => (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="h-96 animate-pulse bg-gray-100 rounded-2xl" />
      </div>
    </div>
  ),
})

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <LiveDemo />
        <Features />
        <Rails />
        <HowItWorks />
        <Pricing />
        <CTA>
          <ContactForm />
        </CTA>
      </main>
      <Footer />
    </>
  )
}
