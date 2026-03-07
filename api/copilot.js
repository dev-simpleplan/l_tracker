module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const question = String(body.question || "").trim().slice(0, 500);
    const portfolioSummary = String(body.portfolioSummary || "").trim().slice(0, 6000);
    const safeQuestion = question || "Give best next steps to reduce interest and penalties.";

    const prompt = [
      "You are a loan payoff copilot for a personal loan tracker app.",
      "Reply in plain text with 4 concise numbered action steps.",
      "Be specific, practical, and use numbers when possible.",
      `Portfolio summary: ${portfolioSummary || "No loans added yet."}`,
      `User question: ${safeQuestion}`,
    ].join("\n");

    const preferredModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const modelCandidates = [preferredModel, "gemini-2.0-flash", "gemini-1.5-flash"].filter(
      (model, index, arr) => model && arr.indexOf(model) === index
    );

    let geminiResponse = null;
    let lastErrorText = "";
    let usedModel = "";

    for (const model of modelCandidates) {
      usedModel = model;
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 260,
            },
          }),
        }
      );

      if (geminiResponse.ok) break;
      lastErrorText = await geminiResponse.text();
      if (geminiResponse.status !== 404) break;
    }

    if (!geminiResponse || !geminiResponse.ok) {
      res.status(502).json({
        error: "Gemini request failed",
        details: `[model=${usedModel}] ${lastErrorText.slice(0, 600)}`,
      });
      return;
    }

    const payload = await geminiResponse.json();
    const text =
      payload &&
      payload.candidates &&
      payload.candidates[0] &&
      payload.candidates[0].content &&
      payload.candidates[0].content.parts &&
      payload.candidates[0].content.parts[0] &&
      payload.candidates[0].content.parts[0].text;

    const responseText = String(text || "").trim();
    if (!responseText) {
      res.status(502).json({ error: "Gemini returned empty response" });
      return;
    }

    res.status(200).json({ response: responseText, model: usedModel });
  } catch (error) {
    res.status(500).json({ error: "Copilot server error", details: error && error.message ? error.message : "" });
  }
};
