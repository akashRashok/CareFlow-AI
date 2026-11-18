import type { RosterAssignment, Worker } from "@/lib/types";

export type RosterRuleRisk = {
  severity: "low" | "medium" | "high";
  risk_type: "availability" | "skill_mismatch" | "overtime" | "travel_time" | "participant_preference" | "continuity" | "cost";
  explanation: string;
  evidence: string;
  suggested_action: string;
  source: "deterministic";
};

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function evaluateRosterRules(assignment: RosterAssignment, workers: Worker[], overtimeThresholdHours = 8): RosterRuleRisk[] {
  const risks: RosterRuleRisk[] = [];
  const workerSkills = new Set((assignment.workers?.skills ?? []).map((skill) => skill.toLowerCase()));
  const missingSkills = (assignment.required_skills ?? []).filter((skill) => !workerSkills.has(skill.toLowerCase()));
  const shiftDay = dayNames[new Date(assignment.shift_start).getDay()];
  const availability = (assignment.workers?.availability ?? []).map((entry) => entry.toLowerCase());
  const durationHours = (new Date(assignment.shift_end).getTime() - new Date(assignment.shift_start).getTime()) / 36e5;
  const averageCost = workers.length ? workers.reduce((sum, worker) => sum + Number(worker.hourly_cost ?? 0), 0) / workers.length : 0;

  if (availability.length && !availability.some((entry) => entry.includes(shiftDay) || (["monday", "tuesday", "wednesday", "thursday", "friday"].includes(shiftDay) && entry.includes("weekday")) || (["saturday", "sunday"].includes(shiftDay) && entry.includes("weekend")))) {
    risks.push({
      severity: "high",
      risk_type: "availability",
      explanation: "Assigned worker availability does not match the rostered shift day.",
      evidence: `Shift day ${shiftDay}; availability ${availability.join(", ")}.`,
      suggested_action: "Confirm worker availability or assign an available worker.",
      source: "deterministic"
    });
  }

  if (missingSkills.length) {
    risks.push({
      severity: "high",
      risk_type: "skill_mismatch",
      explanation: "Assigned worker is missing required participant support skills.",
      evidence: `Missing skills: ${missingSkills.join(", ")}.`,
      suggested_action: "Assign a worker with the required skills or arrange supervisor review.",
      source: "deterministic"
    });
  }

  if (!assignment.travel_time_minutes) {
    risks.push({
      severity: "medium",
      risk_type: "travel_time",
      explanation: "Travel time is missing for this roster assignment.",
      evidence: "Travel time minutes are blank.",
      suggested_action: "Add travel time or confirm it is not required.",
      source: "deterministic"
    });
  }

  if (assignment.usual_worker_id && assignment.worker_id !== assignment.usual_worker_id) {
    risks.push({
      severity: "medium",
      risk_type: "continuity",
      explanation: "Assigned worker differs from the participant's usual worker.",
      evidence: `Assigned ${assignment.workers?.full_name}; usual ${assignment.usual_worker?.full_name}.`,
      suggested_action: "Check whether continuity of care is important for this shift.",
      source: "deterministic"
    });
  }

  const preferences = (assignment.participants?.preferences ?? []).join(" ").toLowerCase();
  if (preferences && assignment.workers?.full_name && !preferences.includes(assignment.workers.full_name.toLowerCase()) && preferences.includes("prefers")) {
    risks.push({
      severity: "low",
      risk_type: "participant_preference",
      explanation: "Participant preferences may not match the assigned worker.",
      evidence: assignment.participants?.preferences.join(", ") ?? "Preference recorded.",
      suggested_action: "Review participant preference notes before confirming the roster.",
      source: "deterministic"
    });
  }

  if (durationHours > overtimeThresholdHours) {
    risks.push({
      severity: "medium",
      risk_type: "overtime",
      explanation: "Shift duration exceeds the configured overtime review threshold.",
      evidence: `Shift duration ${durationHours.toFixed(1)} hours; threshold ${overtimeThresholdHours} hours.`,
      suggested_action: "Check worker daily hours and overtime impact.",
      source: "deterministic"
    });
  }

  if (assignment.estimated_cost && averageCost && Number(assignment.estimated_cost) > averageCost * durationHours * 1.25) {
    risks.push({
      severity: "low",
      risk_type: "cost",
      explanation: "Estimated cost is higher than comparable worker cost.",
      evidence: `Estimated cost ${assignment.estimated_cost}; average hourly cost ${averageCost.toFixed(2)}.`,
      suggested_action: "Review whether the higher cost is justified by skills or continuity.",
      source: "deterministic"
    });
  }

  return risks;
}

