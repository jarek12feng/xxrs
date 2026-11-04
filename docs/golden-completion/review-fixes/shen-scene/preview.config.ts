import {defineConfig} from 'vite';import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],cacheDir:'docs/golden-completion/review-fixes/shen-scene/.vite',server:{host:'127.0.0.1',port:5388,strictPort:true,hmr:false,watch:{ignored:['**/*']}}});
