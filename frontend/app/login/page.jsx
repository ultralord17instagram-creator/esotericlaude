import AuthPage from '../components/auth/AuthPage'
import { buildMetadata } from '../seo.config'

// noindex: страница входа не несёт уникального контента и в выдаче не нужна.
// follow оставляем, чтобы вес по ссылкам с неё уходил на разделы сайта.
// В robots.txt страница НЕ закрыта специально: иначе бот не прочитает noindex.
export const metadata = buildMetadata({
  title: 'Вход',
  description: 'Войдите в Astrix, чтобы открыть свой день по звёздам: гороскоп, натальная карта и лунный календарь.',
  path: '/login',
  noindex: true,
})

export default function LoginPage() {
  return <AuthPage mode="login" />
}
