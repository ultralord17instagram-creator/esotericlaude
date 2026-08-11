import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import { buildMetadata } from '../../seo.config'
import LandingClient from './LandingClient'
import CompatClient from './CompatClient'
import RevealClient from './RevealClient'
import TerminalClient from './TerminalClient'
import HoroLoveClient from './HoroLoveClient'
import DiagnosticClient from './DiagnosticClient'
import RodClient from './RodClient'
import DarClient from './DarClient'

// generateStaticParams здесь сознательно НЕ объявлен. Пререндер лендингов на
// сборке ломается на /lp/horo-love: HoroLoveClient читает deep-link ?v= через
// useSearchParams, а при статической генерации это требует Suspense-границы и
// отдало бы в HTML пустую оболочку. Динамический SSR отдаёт краулеру ровно тот
// же полный HTML, просто без кеша на сборке.
export function generateMetadata({ params }) {
  const l = getLanding(params.slug)
  if (!l) return {}
  // absoluteTitle: лендинги самодостаточны и продают сами по себе, суффикс
  // бренда в их title только съедает место в выдаче.
  return buildMetadata({
    title: l.meta.title,
    absoluteTitle: true,
    description: l.meta.description,
    path: `/lp/${l.slug}`,
  })
}

export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  const Client =
    landing.engine === 'compat-jealous' ? CompatClient :
    landing.engine === 'live-reveal' ? RevealClient :
    landing.engine === 'terminal' ? TerminalClient :
    landing.engine === 'horo-love' ? HoroLoveClient :
    landing.engine === 'diagnostic' ? DiagnosticClient :
    landing.engine === 'dar' ? DarClient :
    landing.engine === 'rod' ? RodClient :
    LandingClient
  return <Client landing={landing} />
}
