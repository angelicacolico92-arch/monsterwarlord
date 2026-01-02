import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We cast process to any to avoid 'process is not defined' TS errors if @types/node isn't loaded by the main tsconfig.
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Prioritize Vercel system env vars (process.env) if available
  const apiKey = (process as any).env?.API_KEY || env.API_KEY || '';
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the GenAI SDK
      // Ensure we pass a string, as JSON.stringify(undefined) is undefined which is invalid for define
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});