// scripts/test-llm.mjs
//
// Goal: prove the "Summarization Agent" idea works.
// We send a fake inbound email reply to Groq's LLM and ask it to extract
// the exact fields our `Signal` data model needs (see spec section 2).

const fakeReply = `Hi, thanks for reaching out! We're definitely interested, but I need
to know more about pricing for our team of 50. Also, can you confirm this integrates
with Salesforce? We're hoping to make a decision before end of quarter.`;

const systemPrompt = `You are a sales signal extraction agent. Given an inbound email
reply from a lead, return ONLY a raw JSON object — no markdown, no code fences, no
preamble — with exactly these fields:

{
  "sentiment": "positive" | "neutral" | "negative" | "frustrated",
  "summaryText": "one sentence summary of what the lead said",
  "signalTags": ["budget_mentioned", "objection", "timeline_mentioned", ...],
  "recommendedAction": "send_pricing" | "schedule_call" | "answer_question" | "no_action",
  "confidence": a number between 0 and 1
}`;

const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: fakeReply },
    ],
  }),
});

const data = await response.json();
const raw = data.choices?.[0]?.message?.content;

console.log("--- RAW MODEL OUTPUT ---");
console.log(raw);

try {
  const signal = JSON.parse(raw);
  console.log("\n--- PARSED SIGNAL (this is what would get saved to the `signals` table) ---");
  console.log(signal);
} catch (e) {
  console.log("\nCouldn't parse as JSON — the model added extra text.");
}
