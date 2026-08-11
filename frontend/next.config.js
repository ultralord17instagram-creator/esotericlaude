/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone — минимальный образ для Docker (без node_modules в финальном слое)
  output: 'standalone',

  // Убираем заголовок X-Powered-By: Next.js — лишняя информация о стеке
  // в каждом ответе, на SEO не влияет, но и пользы не несёт.
  poweredByHeader: false,

  // Без слэша на конце. Значение должно совпадать с тем, как формируются
  // canonical в seo.config.js, иначе получим дубли /path и /path/.
  trailingSlash: false,
}

export default nextConfig
