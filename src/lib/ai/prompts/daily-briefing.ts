import { CAREOPS_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared";

export function buildDailyBriefingPrompt(context: unknown) {
  return [
    { role: "system" as const, content: CAREOPS_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Create a daily operations briefing from these unresolved demo records.

Context:
${JSON.stringify(context, null, 2)}

Return JSON:
{
  "executive_summary": "brief summary",
  "top_priorities": [{"priority":"low|medium|high","title":"title","reason":"reason","recommended_action":"action","related_record_type":"type","related_record_id":"id"}],
  "risks_by_category": [{"category":"category","count":1,"summary":"summary"}],
  "suggested_today_plan": ["step"],
  "disclaimer": "Demo only. This briefing supports human review and does not make care, compliance, payroll, or eligibility decisions."
}`
    }
  ];
}

