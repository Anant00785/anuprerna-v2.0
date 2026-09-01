/**
 * Shared feedback classifier — separates human triage input from
 * machine-generated feedback rows (e.g. Mission Control auto-posted
 * engineering/SEO task specs) so dashboards and nav badges count/display
 * them consistently. Single source of truth: both the Page Feedback
 * dashboard (src/app/feedback/FeedbackDashboard.tsx) and the sidebar nav
 * badge (src/components/weave/WeaveShell.tsx) import from here.
 *
 * Non-destructive: this module only classifies for display/counting —
 * it never deletes or hides rows from the underlying data.
 */

// Exact submitter_name values that mark a feedback row as automated/machine-
// generated rather than a human triage item. Blank/empty submitter names are
// deliberately NOT included here — they fall through to displayName()'s
// "Team member" fallback and count as human.
export const AUTOMATED_SUBMITTERS = new Set(["Mission Control", "journey-test runner"]);

export function isAutomated(submitterName: string | null | undefined): boolean {
  return AUTOMATED_SUBMITTERS.has((submitterName || "").trim());
}

// Display fallback for a blank/whitespace-only submitter name.
export function displayName(submitterName: string | null | undefined): string {
  return (submitterName || "").trim() || "Team member";
}
