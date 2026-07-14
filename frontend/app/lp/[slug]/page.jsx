import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import LandingClient from './LandingClient'

export function generateMetadata({ params }) {
  const l = getLanding(params.slug)
  if (!l) return {}
  return { title: l.meta.title, description: l.meta.description, robots: { index: true, follow: true } }
}

export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  return <LandingClient landing={landing} />
}
