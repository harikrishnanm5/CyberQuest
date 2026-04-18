import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.AMD_CLOUD_ENDPOINT': JSON.stringify(env.AMD_CLOUD_ENDPOINT || 'https://api.amd-cloud.example/v1'),
      'process.env.AMD_CLOUD_API_KEY': JSON.stringify(env.AMD_CLOUD_API_KEY),
      'process.env.AMD_TERMINAL_MODEL': JSON.stringify(env.AMD_TERMINAL_MODEL || 'terminal-emulator-v1'),
      'process.env.AMD_AXIOM_MENTOR_MODEL': JSON.stringify(env.AMD_AXIOM_MENTOR_MODEL || 'axiom-mentor-v1'),
      'process.env.AMD_AXIOM_ASSESSMENT_MODEL': JSON.stringify(env.AMD_AXIOM_ASSESSMENT_MODEL || 'axiom-assessment-v1'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
