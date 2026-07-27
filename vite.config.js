import { defineConfig } from 'vite';
import { minify as minifyHtml } from 'html-minifier-terser';

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

export default defineConfig({
  base: '/tandem/',
  plugins: [htmlMinify()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2018',
    cssMinify: 'esbuild',
    minify: 'terser',
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
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
});
