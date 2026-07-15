import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import LandingClient from './LandingClient'
import CompatClient from './CompatClient'
import RevealClient from './RevealClient'

export function generateMetadata({ params }) {
  const l = getLanding(params.slug)
  if (!l) return {}
  return { title: l.meta.title, description: l.meta.description, robots: { index: true, follow: true } }
}

export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  const Client =
    landing.engine === 'compat-jealous' ? CompatClient :
    landing.engine === 'live-reveal' ? RevealClient :
    LandingClient
  return <Client landing={landing} />
}
