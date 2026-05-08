#!/usr/bin/env node
const requiredPackages = ["Starter System ($49)", "Pro Follow-Up System ($149)", "Custom Build"];
const expectedRedirects = {
  "Starter System ($49)": "https://buy.stripe.com/...",
  "Pro Follow-Up System ($149)": "https://buy.stripe.com/...",
  "Custom Build": "https://cal.com/your-booking-link",
};

const tallyFormUrl = process.env.TALLY_PUBLIC_FORM_URL;
const dashboardBaseUrl = process.env.TALLY_LEAD_BASE_URL ?? process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000";

async function verifyPublicTallyForm() {
  if (!tallyFormUrl) {
    return {
      skipped: true,
      message: "Set TALLY_PUBLIC_FORM_URL to verify the live public Tally form contains the package selector.",
    };
  }

  const response = await fetch(tallyFormUrl);
  const html = await response.text();
  const missingPackages = requiredPackages.filter((label) => !html.includes(label));

  return {
    skipped: false,
    status: response.status,
    ok: response.ok && missingPackages.length === 0,
    missingPackages,
  };
}

async function verifyRedirect(packageName) {
  const url = new URL("/lead/next-step", dashboardBaseUrl);
  url.searchParams.set("package", packageName);

  const response = await fetch(url, { method: "HEAD", redirect: "manual" });
  const location = response.headers.get("location") ?? "";

  return {
    package: packageName,
    status: response.status,
    location,
    ok: response.status >= 300 && response.status < 400 && location === expectedRedirects[packageName],
  };
}

async function main() {
  const tallyForm = await verifyPublicTallyForm();
  const redirects = await Promise.all(requiredPackages.map(verifyRedirect));
  const output = { tallyForm, redirects };

  console.log(JSON.stringify(output, null, 2));

  const redirectFailure = redirects.find((result) => !result.ok);
  if ((!tallyForm.skipped && !tallyForm.ok) || redirectFailure) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
