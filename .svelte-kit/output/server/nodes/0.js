

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.C9hnvHle.js","_app/immutable/chunks/DtDmOkZC.js","_app/immutable/chunks/BzQdJGSh.js"];
export const stylesheets = [];
export const fonts = [];
