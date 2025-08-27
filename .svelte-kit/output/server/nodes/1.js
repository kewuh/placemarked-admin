

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.C1wYTHFM.js","_app/immutable/chunks/Q9p8_eM0.js","_app/immutable/chunks/BzQdJGSh.js","_app/immutable/chunks/D7YgKBWV.js"];
export const stylesheets = [];
export const fonts = [];
