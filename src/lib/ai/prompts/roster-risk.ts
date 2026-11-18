import { CAREOPS_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared";
import type { RosterAssignment, Worker } from "@/lib/types";

export function buildRosterRiskPrompt(assignment: RosterAssignment, deterministicRisks: unknown[], workers: Worker[]) {
  return [
    { role: "system" as const, content: CAREOPS_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Review this roster assignment. Explain and prioritize deterministic findings but do not remove them.

Context:
Participant: ${assignment.participants?.full_name}
Participant needs: ${(assignment.required_skills ?? []).join(", ")}
Participant preferences: ${(assignment.participants?.preferences ?? []).join(", ")}
Assigned worker: ${assignment.workers?.full_name}
Worker skills: ${(assignment.workers?.skills ?? []).join(", ")}
Worker availability: ${(assignment.workers?.availability ?? []).join(", ")}
Usual worker: ${assignment.usual_worker?.full_name ?? "None"}
Service type: ${assignment.service_type}
Travel time minutes: ${assignment.travel_time_minutes ?? "Missing"}
Estimated cost: ${assignment.estimated_cost ?? "Missing"}
Alternative workers: ${workers.map((worker) => `${worker.full_name}: skills ${worker.skills.join(", ")}; availability ${worker.availability.join(", ")}; cost ${worker.hourly_cost}`).join(" | ")}
Deterministic risks: ${JSON.stringify(deterministicRisks)}

Return JSON:
{
  "overall_risk": "low|medium|high",
  "summary": "brief summary",
  "risks": [{"severity":"low|medium|high","risk_type":"availability|skill_mismatch|overtime|travel_time|participant_preference|continuity|cost","explanation":"why","evidence":"source snippet","suggested_action":"action"}],
  "alternative_recommendations": [{"worker_name":"name","reason":"reason","tradeoffs":"tradeoff"}],
  "human_review_required": true
}`
    }
  ];
}

