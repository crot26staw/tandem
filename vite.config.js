import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { minify as minifyHtml } from 'html-minifier-terser';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Два режима сборки:
 *
 *   npm run build      — статика для GitHub Pages (dist/)
 *   npm run build:wp   — ассеты для темы WordPress (dist-wp/)
 *
 * Отличий три:
 *   1. base. На Pages сайт живет в подпапке /tandem/, в теме WP ассеты
 *      лежат в /wp-content/themes/..., поэтому пути делаем относительными.
 *   2. Входные файлы. Для статики это html-страницы, для WP — сразу js и css:
 *      разметку там отдает PHP, а подключать удобнее чистые ассеты.
 *   3. Манифест. PHP не знает хеши в именах файлов и берет их из
 *      dist-wp/.vite/manifest.json.
 */

// Vite минифицирует JS и CSS, но HTML оставляет почти как есть.
// Этот плагин дожимает разметку в готовой сборке.
function htmlMinify() {
  return {
    name: 'html-minify',
    apply: 'build',
    enforce: 'post',
    async transformIndexHtml(html) {
      return minifyHtml(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      });
    },
  };
}

// Страницы статической сборки. Папка prices/ дает чистый адрес
// /prices/ без .html — добавляя новую страницу, дописывайте сюда.
const HTML_PAGES = {
  main: resolve(root, 'index.html'),
  prices: resolve(root, 'prices/index.html'),
};

// Точки входа для темы: по одной на шаблон плюс общие стили.
// Ключи станут ключами в manifest.json, по ним PHP и ищет файлы.
const WP_ENTRIES = {
  main: resolve(root, 'src/js/main.js'),
  prices: resolve(root, 'src/js/prices.js'),
  style: resolve(root, 'src/styles/main.css'),
};

export default defineConfig(({ mode }) => {
  const isWordPress = mode === 'wp';

  return {
    // './' — пути внутри css остаются относительными и не ломаются,
    // в какую бы папку темы ни легла сборка
    base: isWordPress ? './' : '/tandem/',
    plugins: [htmlMinify()],
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: isWordPress ? 'dist-wp' : 'dist',
      emptyOutDir: true,
      target: 'es2018',
      cssMinify: 'esbuild',
      minify: 'terser',
      // Манифест нужен только PHP: в статике пути подставляет сам Vite
      manifest: isWordPress,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
        },
        format: {
          comments: false,
        },
      },
      assetsInlineLimit: 4096,
      rollupOptions: {
        input: isWordPress ? WP_ENTRIES : HTML_PAGES,
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  };
});
