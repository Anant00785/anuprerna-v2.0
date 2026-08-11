// @ts-nocheck
export function parseAddPatternInput(body: any) {
  return {
    name: String(body.name || ''),
  };
}

export function parseUpdatePatternInput(body: any) {
  return {
    id: BigInt(body.id),
    name: String(body.name || ''),
  };
}
// @ts-nocheck
// @ts-nocheck
