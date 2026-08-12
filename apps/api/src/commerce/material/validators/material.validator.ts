export function validateAddMaterial(data: any) {
  if (!data.name || data.name.length < 1 || data.name.length > 255) {
    throw new Error('Invalid name');
  }
}
