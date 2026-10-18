import { controlsStyles } from './src/styles/controls';
import { layoutStyles } from './src/styles/layout';
import { contentStyles } from './src/styles/content';
import { dialogsStyles } from './src/styles/dialogs';
import { defineConfig, presetWind3 } from 'unocss';
export default defineConfig({
  content: { filesystem: ['src/**/*.{tsx,ts}'] },
  shortcuts: { ...controlsStyles, ...layoutStyles, ...contentStyles, ...dialogsStyles },
  presets: [presetWind3()],
});
