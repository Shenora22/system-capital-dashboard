import { z } from "zod";

// A deliberately permissive envelope: Tally may add fields, while malformed
// JSON roots and unexpected "data"/"fields" shapes are rejected safely.
export const tallyLeadEnvelopeSchema = z.object({
  eventType: z.string().optional(),
  type: z.string().optional(),
  event: z.string().optional(),
  fields: z.array(z.unknown()).optional(),
  data: z.object({
    fields: z.array(z.unknown()).optional(),
    formId: z.unknown().optional(),
    responseId: z.unknown().optional(),
    formName: z.unknown().optional(),
  }).passthrough().optional(),
}).passthrough();

export function parseTallyLeadEnvelope(value: unknown) {
  return tallyLeadEnvelopeSchema.safeParse(value);
}
