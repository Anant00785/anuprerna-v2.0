import { z } from "zod";

// EXAMPLE schema — the pattern every domain type follows.
// dev: replace/extend with the real Loom/commerce contracts as modules are converted.
export const CustomerSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),        // decrypted at the API boundary; never store plaintext
  provider: z.enum(["BASIC", "GOOGLE", "UNKNOWN"]),
});
export type Customer = z.infer<typeof CustomerSchema>;
