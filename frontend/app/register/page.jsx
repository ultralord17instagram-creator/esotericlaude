import AuthPage from '../components/auth/AuthPage'
import { buildMetadata } from '../seo.config'

// noindex, follow — см. комментарий в app/login/page.jsx.
export const metadata = buildMetadata({
  title: 'Регистрация',
  description: 'Создайте аккаунт Astrix за минуту и получите первый разбор дня: гороскоп, натальная карта и лунный календарь.',
  path: '/register',
  noindex: true,
})

export default function RegisterPage() {
  return <AuthPage mode="register" />
}
