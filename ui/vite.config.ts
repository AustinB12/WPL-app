import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }

            // Material-UI packages (large library, separate chunk)
            if (id.includes('@mui/') || id.includes('@emotion/')) {
              return 'mui-vendor';
            }

            // Data/state management and utilities
            if (id.includes('@tanstack/react-query') || id.includes('date-fns') || id.includes('dayjs')) {
              return 'utils-vendor';
            }

            // All other node_modules go into a general vendor chunk
            // This catches any other dependencies
            return 'vendor';
          }

          // Application code stays in the main chunk by default
          // Vite will handle code-splitting for dynamic imports automatically
        },
      },
    },
  },
});
