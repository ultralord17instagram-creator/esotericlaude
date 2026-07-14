export const metadata = { robots: { index: true, follow: true } }

export default function LpLayout({ children }) {
  return <div className="lp-root">{children}</div>
}
