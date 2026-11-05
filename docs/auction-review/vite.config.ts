import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
// Isolated QA server: avoid hot reload resets while other chats edit shared sources.
export default defineConfig({plugins:[vue()],server:{host:'127.0.0.1',port:5277,strictPort:true,hmr:false}});
