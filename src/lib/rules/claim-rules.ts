import type { Claim } from "@/lib/types";
import { wordCount } from "@/lib/utils";

export type ClaimRuleIssue = {
  severity: "low" | "medium" | "high";
  issue_type:
    | "missing_evidence"
    | "vague_note"
    | "hours_mismatch"
    | "service_mismatch"
    | "duplicate_risk"
    | "requires_manual_review";
  explanation: string;
  evidence: string;
  suggested_action: string;
  source: "deterministic";
};

export function evaluateClaimRules(claim: Claim): ClaimRuleIssue[] {
  const issues: ClaimRuleIssue[] = [];
  const supportNote = claim.shift_notes?.raw_note ?? "";

  if (Number(claim.invoice_hours) !== Number(claim.rostered_hours)) {
    issues.push({
      severity: "high",
      issue_type: "hours_mismatch",
      explanation: "Invoice hours differ from rostered hours.",
      evidence: `Rostered hours ${claim.rostered_hours}; invoice hours ${claim.invoice_hours}.`,
      suggested_action: "Confirm the attended duration and correct either the roster or invoice before claim submission.",
      source: "deterministic"
    });
  }

  if (!supportNote.trim()) {
    issues.push({
      severity: "high",
      issue_type: "missing_evidence",
      explanation: "No support note is linked to this claim.",
      evidence: "Support note is missing.",
      suggested_action: "Request the support note or attach the correct shift note.",
      source: "deterministic"
    });
  } else if (wordCount(supportNote) < 30) {
    issues.push({
      severity: "medium",
      issue_type: "vague_note",
      explanation: "Support note is short and may not provide enough service evidence.",
      evidence: supportNote,
      suggested_action: "Ask the worker to add specific activities, participant response, and outcomes.",
      source: "deterministic"
    });
  }

  if (supportNote && !supportNote.toLowerCase().includes(claim.service_type.toLowerCase())) {
    issues.push({
      severity: "medium",
      issue_type: "service_mismatch",
      explanation: "Support note does not explicitly mention the claimed service type.",
      evidence: `Claim service type: ${claim.service_type}.`,
      suggested_action: "Check whether the note supports the claimed service category.",
      source: "deterministic"
    });
  }

  if (!claim.service_agreement_summary?.trim()) {
    issues.push({
      severity: "medium",
      issue_type: "missing_evidence",
      explanation: "Service agreement summary is missing.",
      evidence: "No service agreement summary provided.",
      suggested_action: "Add the relevant service agreement summary before final review.",
      source: "deterministic"
    });
  }

  if (Number(claim.invoice_amount) <= 0) {
    issues.push({
      severity: "high",
      issue_type: "requires_manual_review",
      explanation: "Invoice amount is zero or negative.",
      evidence: `Invoice amount ${claim.invoice_amount}.`,
      suggested_action: "Review invoice generation before claim readiness approval.",
      source: "deterministic"
    });
  }

  return issues;
}

