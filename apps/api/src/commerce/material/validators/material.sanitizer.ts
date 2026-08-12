// @ts-nocheck
export function sanitizeMaterialName(name: string) {
  return name.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// @ts-nocheck
// @ts-nocheck
