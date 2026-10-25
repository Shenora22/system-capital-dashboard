import { describe, expect, it } from "vitest";
import { parseTallyLeadEnvelope } from "../lib/lead-input-schema";

describe("Tally lead input envelope", () => {
  it("accepts a normal event and preserves unknown provider fields", () => {
    const result = parseTallyLeadEnvelope({
      eventType: "FORM_RESPONSE",
      data: { fields: [{ label: "Email", value: "test@example.com" }] },
      providerExtra: "allowed",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.providerExtra).toBe("allowed");
  });

  it.each([null, [], "text", 7])("rejects non-object root %s", (value) => {
    expect(parseTallyLeadEnvelope(value).success).toBe(false);
  });

  it("rejects malformed data envelope", () => {
    expect(parseTallyLeadEnvelope({ data: [] }).success).toBe(false);
  });

  it("rejects malformed fields", () => {
    expect(parseTallyLeadEnvelope({ fields: "not-array" }).success).toBe(false);
  });

  it("accepts a flat webhook payload for backward compatibility", () => {
    expect(parseTallyLeadEnvelope({ name: "Example", email: "test@example.com" }).success).toBe(true);
  });
});
