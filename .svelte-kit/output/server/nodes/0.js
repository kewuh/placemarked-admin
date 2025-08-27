

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BClK_6jJ.js","_app/immutable/chunks/Q9p8_eM0.js","_app/immutable/chunks/BzQdJGSh.js"];
export const stylesheets = [];
export const fonts = [];
