import { CAREOPS_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared";
import type { ShiftNote } from "@/lib/types";

export function buildShiftNoteReviewPrompt(note: ShiftNote) {
  return [
    { role: "system" as const, content: CAREOPS_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Review this support worker note for a care coordinator.

Context:
Participant: ${note.participants?.full_name}
Goals: ${(note.participants?.goals ?? []).join(", ")}
Known risks: ${(note.participants?.known_risks ?? []).join(", ")}
Worker: ${note.workers?.full_name}
Service type: ${note.service_type}
Raw note: ${note.raw_note}

Return JSON:
{
  "cleaned_note": "professional care note",
  "wellbeing_summary": "brief summary",
  "observed_signals": ["signal"],
  "risk_flags": [{"severity":"low|medium|high","title":"risk","explanation":"why","evidence":"exact snippet"}],
  "missing_information": ["missing item"],
  "suggested_follow_up_actions": ["action"],
  "claim_note_quality": "good|needs_review|poor",
  "requires_human_review": true
}`
    }
  ];
}

