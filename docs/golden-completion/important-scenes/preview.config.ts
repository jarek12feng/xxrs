import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],optimizeDeps:{entries:['docs/golden-completion/important-scenes/preview.html']},server:{host:'127.0.0.1',port:5298,strictPort:true}});
