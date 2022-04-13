import { defineConfig } from 'astro/config';
import { vitePluginCommonjs } from 'vite-plugin-commonjs'

import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://my-astro-course.netlify.app',
  adapter: netlify(),
  vite: {
    plugins: [
      vitePluginCommonjs()
    ]
  },
});
