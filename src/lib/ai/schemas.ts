import { z } from "zod";

export const RiskSeveritySchema = z.enum(["low", "medium", "high"]);

export const ShiftNoteAIReviewSchema = z.object({
  cleaned_note: z.string(),
  wellbeing_summary: z.string(),
  observed_signals: z.array(z.string()),
  risk_flags: z.array(
    z.object({
      severity: RiskSeveritySchema,
      title: z.string(),
      explanation: z.string(),
      evidence: z.string()
    })
  ),
  missing_information: z.array(z.string()),
  suggested_follow_up_actions: z.array(z.string()),
  claim_note_quality: z.enum(["good", "needs_review", "poor"]),
  requires_human_review: z.boolean()
});

export type ShiftNoteAIReview = z.infer<typeof ShiftNoteAIReviewSchema>;

export const ClaimReadinessReviewSchema = z.object({
  readiness_status: z.enum(["ready", "needs_review", "not_ready"]),
  summary: z.string(),
  issues: z.array(
    z.object({
      severity: RiskSeveritySchema,
      issue_type: z.enum([
        "missing_evidence",
        "vague_note",
        "hours_mismatch",
        "service_mismatch",
        "duplicate_risk",
        "requires_manual_review"
      ]),
      explanation: z.string(),
      evidence: z.string(),
      suggested_action: z.string()
    })
  ),
  recommended_actions: z.array(z.string()),
  human_review_required: z.boolean(),
  disclaimer: z.string()
});

export type ClaimReadinessReview = z.infer<typeof ClaimReadinessReviewSchema>;

export const RosterRiskReviewSchema = z.object({
  overall_risk: RiskSeveritySchema,
  summary: z.string(),
  risks: z.array(
    z.object({
      severity: RiskSeveritySchema,
      risk_type: z.enum([
        "availability",
        "skill_mismatch",
        "overtime",
        "travel_time",
        "participant_preference",
        "continuity",
        "cost"
      ]),
      explanation: z.string(),
      evidence: z.string(),
      suggested_action: z.string()
    })
  ),
  alternative_recommendations: z.array(
    z.object({
      worker_name: z.string(),
      reason: z.string(),
      tradeoffs: z.string()
    })
  ),
  human_review_required: z.boolean()
});

export type RosterRiskReview = z.infer<typeof RosterRiskReviewSchema>;

export const DailyOpsBriefingSchema = z.object({
  executive_summary: z.string(),
  top_priorities: z.array(
    z.object({
      priority: RiskSeveritySchema,
      title: z.string(),
      reason: z.string(),
      recommended_action: z.string(),
      related_record_type: z.string(),
      related_record_id: z.string()
    })
  ),
  risks_by_category: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
      summary: z.string()
    })
  ),
  suggested_today_plan: z.array(z.string()),
  disclaimer: z.string()
});

export type DailyOpsBriefing = z.infer<typeof DailyOpsBriefingSchema>;

