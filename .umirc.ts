import { defineConfig } from 'umi';
import WorkboxPlugin from 'workbox-webpack-plugin';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  mpa: {},
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  chainWebpack(memo) {
    memo.plugin('pwa')
      .use(WorkboxPlugin.GenerateSW, [{
        clientsClaim: true,
        skipWaiting: true,
      }]);
  },
});
