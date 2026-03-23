import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/featured-product.ts',
      formats: ['es'],
      fileName: 'featured-product',
    },
  },
});
