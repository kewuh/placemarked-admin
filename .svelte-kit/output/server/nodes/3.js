

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.B0by022u.js","_app/immutable/chunks/Q9p8_eM0.js","_app/immutable/chunks/BzQdJGSh.js","_app/immutable/chunks/WdimBvxA.js"];
export const stylesheets = ["_app/immutable/assets/3.D6Rpq6qD.css"];
export const fonts = [];
