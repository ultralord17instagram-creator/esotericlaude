import AuthPage from '../components/auth/AuthPage'

export const metadata = {
  title: 'Регистрация в Astrix',
  description: 'Создайте аккаунт Astrix за минуту и получите первый разбор дня: гороскоп, натальная карта и лунный календарь.',
}

export default function RegisterPage() {
  return <AuthPage mode="register" />
}
