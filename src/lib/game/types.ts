export interface CrackPoint {
  /** Human-readable description for documentation; not used in prompt. */
  description: string;
  /** Hint to the model on what triggers the break. Embedded into the system prompt. */
  triggerHint: string;
}

export interface Suspect {
  id: string;
  name: string;
  oneLiner: string;
  publicAlibi: string;
  hiddenTruth: string;
  lyingRules: string[];
  crackPoint: CrackPoint;
  personality: string;
}

export interface Case {
  id: string;
  title: string;
  premise: string;
  suspects: Suspect[];
}
