import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],cacheDir:'docs/golden-completion/review/visual-evidence/.vite',server:{host:'127.0.0.1',port:5378,strictPort:true,hmr:false,watch:{ignored:['**/*']}}});
