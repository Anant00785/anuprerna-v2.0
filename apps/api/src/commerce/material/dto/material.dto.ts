// @ts-nocheck
export function parseAddMaterialInput(body: any) {
  return {
    name: String(body.name || ''),
  };
}

export function parseUpdateMaterialInput(body: any) {
  return {
    id: BigInt(body.id),
    name: String(body.name || ''),
  };
}
// @ts-nocheck
// @ts-nocheck
