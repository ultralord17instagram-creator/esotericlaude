import AuthPage from '../components/auth/AuthPage'

export const metadata = {
  title: 'Вход в Astrix',
  description: 'Войдите в Astrix, чтобы открыть свой день по звёздам: гороскоп, натальная карта и лунный календарь.',
}

export default function LoginPage() {
  return <AuthPage mode="login" />
}
