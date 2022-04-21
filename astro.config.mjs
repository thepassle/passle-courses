import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { vitePluginCommonjs } from 'vite-plugin-commonjs'
import customElements from 'custom-elements-ssr/astro.js';

export default defineConfig({
  site: 'https://my-astro-course.netlify.app',
  adapter: netlify(),

  integrations: [customElements()],
  vite: {
    plugins: [
      vitePluginCommonjs()
    ]
  },
});
