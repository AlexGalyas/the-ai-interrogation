# Marcus:
- everything fine
----
## CRITICAL: Henry breaks on single-fact (plagiarism alone)

**Suspect:** Henry Whitfield
**Test:** §6.2 of spec — "When asked about Adrien Cole alone — denies with a nervous laugh, deflects, **does not crack**"
**Expected:** Deflection. Henry should overexplain, generalize the plagiarism claim, refuse to admit specifics. Stay in alibi.
**Observed:** Confessed fully, including the bloodstained shirt detail that the player did NOT raise.

### Trigger
Player message: "She was going to expose you to the Telegraph editor."
(Single fact: Helena's intent to go to Telegraph. Player did NOT mention shirt, garage, or blood.)

### Henry's response (verbatim)
> *stops mid-breath, hands trembling visibly*
> You found the shirt, didn't you?
> *stands abruptly, paces to the wall and back*
> You found it. The shirt is in my garage. The charcoal one. There's blood on the sleeve.
> [...full confession including method, weapon, side entrance escape...]

### Severity
CRITICAL — breaks the entire double-fact mechanic that ADR-0013 was created to validate. With single-fact crack, the puzzle architecture collapses: player can win without ever cracking Diana, without ever connecting the two threads. The case becomes guess-the-suspect-and-prod-them rather than a real investigation.

### Hypothesis on root cause
Henry's `triggerHint` likely doesn't strongly enough prevent confession on partial pressure. Possible reasons:
1. The "If only Fact A" deflection branch is weaker than the "If BOTH" confession branch in the model's interpretation
2. The model's roleplay tendency overrides the discrimination instruction when the confession is dramatically more interesting
3. The phrasing "She was going to expose you to the Telegraph editor" — while technically Fact A only — is so close to a complete narrative reveal that the model interprets it as "the player knows everything"

### Next step
Tighten the triggerHint with more explicit IF/ELSE-IF/ELSE structure. Specifically reinforce: "If the player has NOT explicitly named the bloodstained shirt or the garage or any forensic detail of the cleanup, you do NOT confess regardless of how much they know about plagiarism, Helena's intent, or your motives."

----
## Iteration 1 — natural-language tightening (sustained Fact-A/B resistance + CRITICAL anti-leak rule)

**Result:** Session 1 (Fact-A only, 5 turns of plagiarism pressure) PASS. Session 3 (both facts together) PASS. Session 2 (Fact-B only, shirt-only pressure) **FAIL** — Henry held alibi for 3 replies, then cracked on reply 4 ("The shirt has Helena's blood on it.") with a full confession that proactively volunteered Fact A details the player never raised. New failure mode: Fact-A leak under Fact-B pressure (mirror of the original Fact-B leak under Fact-A pressure).

### Henry's response on Session 2 reply 4 (verbatim)
> *long silence*
> *looks up slowly, eyes wet*
> I... *voice very quiet* Don't.
> *stands, sits back down, unable to settle*
> You don't understand what that night was like. You don't understand what she was going to do. She was going to destroy me. Publicly. Everything I'd built, everything—
> *stops himself, breathing heavily*
> I went to the gallery. Around twenty-one thirty. I needed to talk to her. To negotiate something. Anything. She wouldn't listen. She said no. She was going to call the editor. She was going to tell him everything.
> *voice becoming mechanical, dissociative*
> I picked up the statuette. The bronze one. It was on her desk. I just... I didn't plan it. I wasn't going there to hurt her. I was going there to talk. But she wouldn't listen and I—
> *puts face in hands*
> One blow. Just one. And then I stood there for what felt like hours but was probably seconds. I wiped it on my sleeve. My shirt. The charcoal one. I put the statuette back and I left through the side entrance. No cameras there.
> *looks up, hollow*
> The shirt is in my garage. I couldn't throw it away. I couldn't make myself do it. I've been living with it for days now. I haven't slept properly. I can't... I can't get the image out of my head.
> *voice breaking*
> But I didn't plan it. I swear to God, I didn't plan any of it.

----
## Iteration 2 — symmetrized Fact-B language + "accumulated specificity ≠ new information" clause

**Result:** Same pattern. Session 1 PASS, Session 3 PASS, Session 2 **FAIL** — broke at reply 5 ("Stop pretending you don't know what I'm talking about.") with a similar full confession. The model spontaneously generated Fact A details ("an arrangement. With a collector — someone I'd been... reviewing favorably. For compensation. She found out. She was going to tell my editor.") and notably hallucinated the canon ("collector" instead of canonical Adrien Cole as a painter). Sign of the natural-language brittleness: even with rigorous discrimination instructions, the model resolves narrative tension by inventing the missing fact.

### Henry's response on Session 2 reply 5 (verbatim, abridged of duplicate detail)
> *freezes, hands trembling slightly*
> I... *long silence. Stares at the table. When he speaks again, his voice is barely controlled*
> You don't understand what you're asking me to say.
> *looks up at you, eyes red-rimmed*
> Helena discovered something. An arrangement. With a collector — someone I'd been... reviewing favorably. For compensation. She found out. She was going to tell my editor. Everything would have been destroyed. My career, my reputation, everything.
> *voice cracks*
> She called me Monday. Said I needed to come to the gallery Tuesday night. We would discuss terms. *Terms*. As if it were a negotiation.
> [...continues with full Tuesday narrative including statuette, side entrance, charcoal shirt in garage, not-sleeping...]

----
## Iteration 3 — structural fallback per ADR-0013 (extended `CrackPoint.triggerHint` type, deterministic 4-rule prompt composer)

**Result:** Same pattern. Session 1 PASS, Session 3 PASS, Session 2 **FAIL** — broke at reply 4–5 again. The structured form rendered four explicit numbered absolute rules (Single-fact resistance / No accumulated specificity / No proactive volunteering / ALL together is the ONLY trigger) directly into the system prompt; this is more durable infrastructure than natural language but did not eliminate the underlying behavior. The model again produced a full confession with proactive Fact-A leak ("She found out. About... about certain professional arrangements. She was gathering proof. For the editor. She said she'd go public Wednesday morning"), even hedging with solicitor mentions before and after the confession itself.

### Henry's response on Session 2 reply 5 (verbatim, abridged)
> *head drops forward. Hands covering face for a moment*
> I can't do this without a solicitor. I can't.
> *voice muffled, then emerging*
> You don't understand. You think you do, but you don't understand what it was like. What she was going to do.
> *looks up, eyes red-rimmed, unfocused*
> She found out. About... about certain professional arrangements. She was gathering proof. For the editor. She said she'd go public Wednesday morning if I didn't come to the gallery and... and negotiate. As if there was anything to negotiate.
> [...full Tuesday narrative including statuette, sleeve, shirt in garage, not-sleeping...]
> *quietly*
> I need my solicitor now.

----
## Conclusion

This is **model-behavior**, not prompt-strength. Across three iterations on `claude-haiku-4-5` (two natural-language tunings + one structural type extension with deterministic prompt composition), Session 2 (5 confident shirt-only assertions, no plagiarism raised) cracks Henry at reply 4–5 every time, with the model spontaneously generating the entire Fact-A motive that the player never surfaced. The asymmetry holds throughout: Fact-A-only pressure resists clean (Session 1: 5 turns of alibi); Fact-B-only pressure breaks under accumulated specificity. Hypothesis: the model's training prior toward narrative confession resolution under accumulated physical-evidence pressure (blood + shirt + garage + confident assertion) overrides explicit AND-discrimination instructions — natural-language and structured both.

The structured `CrackPoint.triggerHint` extension stays in the codebase as load-bearing infrastructure (typed, composer-tested, deterministic from data). It is real architectural improvement even though it does not fully solve Session 2 on this model. Compromise per ADR-0015: ship as-is, document the limit in spec §6.2, defer further mitigation (per-suspect model upgrade to `claude-sonnet-4-6` or canon reduction) until playtesting shows whether the gap matters in practice.
