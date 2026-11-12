// Lazy registry of scene generators: src/scenes/<id>.js exports default build().
import { fallback } from './_fallback.js';

const modules = import.meta.glob(['./*.js', '!./index.js', '!./_*.js']);

export async function loadBuilder(id) {
  const key = `./${id}.js`;
  if (!modules[key]) return fallback;
  try {
    const m = await modules[key]();
    return m.default || fallback;
  } catch (e) {
    console.error(`Scene module ${id} failed to load`, e);
    return fallback;
  }
}
export const hasBuilder = (id) => !!modules[`./${id}.js`];
