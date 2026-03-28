import { NextResponse } from "next/server";

export async function GET() {
  const fallbackData = {
    label: "Risk-On",
    confidence: 77,
    horizon: "Next 72 Hours",
    context: "Liquidity impulse and tighter credit spreads support cyclical risk appetite.",
    updatedAt: "12:00 PM",
    shiftedFrom: "Neutral",
    shiftedTo: "Risk-On",
    shiftTime: "10:30 AM",
    drivers: [
      {
        name: "Liquidity",
        posture: "Risk-On",
        confidence: 82,
        note: "UST buybacks and falling ON RRP balances push liquidity higher."
      },
      {
        name: "Credit",
        posture: "Risk-On",
        confidence: 74,
        note: "IG/HY spreads grinding tighter with inflows."
      }
    ],
    feed: []
  };

  try {
const res = await fetch("http://localhost:5678/webhook/system-capital-signals");
const text = await res.text();
console.log("RAW RESPONSE:", text);

let data;

try {
  data = JSON.parse(text);
} catch {
  return NextResponse.json(fallbackData);
}

return NextResponse.json(data?.label ? data : fallbackData);
} catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(fallbackData);
  }
}