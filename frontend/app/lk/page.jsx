import LKClient from './LKClient'

// robots noindex — ЛК не индексируется
export const metadata = {
  title: 'Личный кабинет',
  robots: { index: false },
}

export default function LKPage() {
  return <LKClient />
}
