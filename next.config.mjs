/** @type {import('next').NextConfig} */
const nextConfig = {
  // Статический экспорт для размещения на shared-хостинге (Beget):
  // сайт собирается в папку out/ как обычные HTML/JS/CSS-файлы.
  output: "export",
  // Каждая страница — папка с index.html (privacy/index.html):
  // nginx Beget сам редиректит /privacy на /privacy/ и отдаёт индекс,
  // .htaccess-правила ему не нужны (и он их не читает).
  trailingSlash: true,
};

export default nextConfig;
