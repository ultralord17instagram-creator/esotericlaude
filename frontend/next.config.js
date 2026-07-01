/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone — минимальный образ для Docker (без node_modules в финальном слое)
  output: 'standalone',
}

export default nextConfig
