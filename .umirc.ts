import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
  chainWebpack: (config) => {
    config.module
      .rule('gltf')
      .test(/\.(gltf)$/)
      .use()
      .loader('url-loader')
      .options('$')
      .end();
  }
});
