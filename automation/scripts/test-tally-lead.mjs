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
      { key: "package", label: "Select Package", value: "Pro" },
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

if (!response.ok || body.success !== true || body.message !== "Lead captured successfully") {
  process.exit(1);
}
