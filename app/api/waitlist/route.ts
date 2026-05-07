export async function POST(request: Request) {
  try {
    const body = await request.json();

    // normalize everything here
    const full_name = body.full_name || body.name || "Unknown";

    if (!body.email) {
      return new Response("Email required", { status: 400 });
    }

    const email = body.email.toLowerCase().trim();
    const company = body.company || "Unknown";
    const role = body.role || "Unknown";

    const cleanData = {
      full_name,
      email,
      company,
      role,
    };

    console.log("[WAITLIST CLEAN DATA]:", cleanData);

    // 🔥 send to n8n
    await fetch("http://localhost:5678/webhook/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanData),
    });

    return Response.json({
      success: true,
      data: cleanData,
    });
  } catch (error) {
    console.error("WAITLIST ERROR:", error);

    return Response.json(
      { success: false, error: "Failed to submit" },
      { status: 500 },
    );
  }
}
