import { defineConfig } from 'astro/config';
import { vitePluginCommonjs } from 'vite-plugin-commonjs'

import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  site: 'https://my-astro-course.netlify.app',
  adapter: netlify(),
  vite: {
    // server: {
    //   hmr: false
    // },
    plugins: [
      vitePluginCommonjs()
    ]
  },
});
