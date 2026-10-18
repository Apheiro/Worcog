import { defineConfig, presetWind3 } from 'unocss';
export default defineConfig({
  content: { filesystem: ['src/**/*.{tsx,ts}'] },
  presets: [presetWind3()],
});
