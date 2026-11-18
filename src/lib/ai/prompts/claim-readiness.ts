import { CAREOPS_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared";
import type { Claim } from "@/lib/types";

export function buildClaimReadinessPrompt(claim: Claim, deterministicIssues: unknown[]) {
  return [
    { role: "system" as const, content: CAREOPS_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Review this mock claim readiness case. Explain and prioritize deterministic findings but do not remove them.

Context:
Participant: ${claim.participants?.full_name}
Service date: ${claim.service_date}
Service type: ${claim.service_type}
Rostered hours: ${claim.rostered_hours}
Invoice hours: ${claim.invoice_hours}
Invoice amount: ${claim.invoice_amount}
Service agreement summary: ${claim.service_agreement_summary ?? "Missing"}
Support note: ${claim.shift_notes?.raw_note ?? "Missing"}
Deterministic issues: ${JSON.stringify(deterministicIssues)}

Return JSON:
{
  "readiness_status": "ready|needs_review|not_ready",
  "summary": "brief summary",
  "issues": [{"severity":"low|medium|high","issue_type":"missing_evidence|vague_note|hours_mismatch|service_mismatch|duplicate_risk|requires_manual_review","explanation":"why","evidence":"source snippet","suggested_action":"action"}],
  "recommended_actions": ["action"],
  "human_review_required": true,
  "disclaimer": "Demo only. This tool does not determine NDIS claim eligibility and does not replace provider compliance review."
}`
    }
  ];
}

