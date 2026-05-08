#!/usr/bin/env node
const baseUrl = process.env.TALLY_LEAD_BASE_URL ?? "http://localhost:3000";
const url = new URL("/api/tally-lead", baseUrl);
url.searchParams.set("dryRun", "1");

const payload = {
  eventType: "FORM_RESPONSE",
  data: {
    formId: "system-capital-intake",
    formName: "System Capital Lead Capture",
    responseId: `test-${Date.now()}`,
    fields: [
      { key: "name", label: "Name", value: "Test Lead" },
      { key: "email", label: "Email", value: "test.lead@example.com" },
      { key: "business", label: "Business", value: "Example Co" },
      { key: "package", label: "Package", value: "Pro Follow-Up System ($149)" },
      { key: "budget", label: "Budget", value: "$500-$1,000" },
      { key: "need", label: "Need", value: "Automated payment and booking follow-up" },
      { key: "source", label: "Source", value: "Tally dry-run test" }
    ]
  }
};

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const body = await response.json();
console.log(JSON.stringify({ status: response.status, body }, null, 2));

const lead = body.lead ?? {};
const expected = {
  package: "Pro Follow-Up System",
  need: "Automated payment and booking follow-up",
  budget: "$500-$1,000",
  source: "Tally dry-run test",
  paymentStatus: "Pending",
  leadStatus: "New Lead",
};

const missingField = Object.entries(expected).find(([key, value]) => lead[key] !== value);

if (!response.ok || body.success !== true || body.message !== "Lead captured successfully" || missingField) {
  if (missingField) {
    console.error(`Expected lead.${missingField[0]} to equal ${missingField[1]}, received ${lead[missingField[0]]}`);
  }
  process.exit(1);
}
