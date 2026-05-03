# Weekend 3 — Real Case

> **Spec status:** Draft (pre-implementation)
> **Time budget:** ~5 hours (with iteration buffer on prompt engineering)
> **Goal:** Promote case-01-soho-gallery from "one-suspect prototype" to a real three-suspect detective case with a coherent timeline, false leads, and earned wins. The mechanic from Weekends 1–2 stays untouched; this is a content + prompt-engineering weekend.

---

## 1. Context

By the end of Weekend 2, the game had a complete loop, but only one suspect (Marcus) — and Marcus was the provisional murderer purely so the game had a winnable state. Mini-Polish made it visually presentable. Weekend 3 makes it a real case.

Weekend 3 is fundamentally a **creative** weekend rather than an engineering one. The architecture stays as-is. The work is in suspect design, timeline coherence, and crack-point engineering: making three AI-driven characters who feel distinct, lie convincingly, and break only when the player surfaces specific facts in specific combinations.

Marcus is reassigned: he goes from "provisional murderer" to "innocent witness who fled the scene." The actual murderer is Henry Whitfield (per ADR-0009's plan). A new third suspect — Diana Reyes, an art-dealer rival — provides a third investigative vector and a path to discover key facts about Henry.

By the end of this weekend, a stranger should be able to read the briefing, interrogate three suspects, find contradictions across the timeline, and accuse Henry with adequate evidence. The case must be solvable through reasoning, not guessing — and unsolvable by simply targeting the most defensive suspect.

---

## 2. Scope

### 2.1 In scope

- **Case canon update** in `case-01-soho-gallery.ts`:
  - `solution.murdererId` changes from `'marcus'` to `'henry'`
  - `solution.requiredEvidence` changes from `['car', 'gallery', '21:30']` to `['Henry', 'Adrien', 'shirt']`
  - `solution.explanation` rewritten to match new canon
  - `premise` rewritten to ~120 words across two paragraphs, surfacing all four briefing-level investigative leads
- **Marcus rewrite** — same suspect ID, same name, same one-liner; new `hiddenTruth`, new `lyingRules`, new `crackPoint`, same `personality`. Marcus is now an innocent witness who found the body and fled.
- **Henry Whitfield (new suspect)** — full `Suspect` object: identity, public alibi, hidden truth (panicked killer, blood-stained shirt hidden in garage), lying rules, double-fact crack point (must mention BOTH Adrien Cole/plagiarism AND the shirt), personality (anxious intellectual).
- **Diana Reyes (new suspect)** — full `Suspect` object: art-dealer rival, solid alibi at Tate Modern vernissage, hidden truth (industrial espionage via Helena's assistant Iris), single-fact crack point (banking transactions).
- **One ADR** capturing the case canon update and Marcus reassignment (ADR-0012, or next free).
- **One ADR** capturing the double-fact crack mechanic for Henry (ADR-0013, or next free).
- **Spec file** (this document) committed at `docs/specs/weekend-3-real-case.md`.
- **Journal file** at `docs/journal/weekend-3.md`.
- **Playwright happy-path E2E updated** to accuse Henry with new evidence keywords. Mock streaming response stays generic.
- **Manual QA** on all three suspects: each holds character through 10+ adversarial questions, each cracks only on the correct fact-combination, Henry specifically resists single-fact pressure.
- **New screen recording** of a full Win playthrough showing all three interrogations and the final accusation against Henry.

### 2.2 Out of scope (explicitly later weekends)

- ❌ AI-driven accusation validation (LLM-as-judge) — Weekend 5
- ❌ Pin / highlight messages as evidence — Weekend 4
- ❌ Visual / animation polish beyond Mini-Polish baseline — Weekend 4
- ❌ Hint system for stuck players — Weekend 5
- ❌ Difficulty levels — Weekend 5
- ❌ Achievements / replay metrics — Weekend 5
- ❌ Adrien Cole as a fourth interrogable suspect — he is canonically a witness but not playable; if we ever make him interrogable, that is a future case expansion
- ⚠️ Type-system extension for structured `triggerHint` (e.g., `{ all: string[] }`) was originally listed as out of scope. **Pulled into scope during Step 6** after manual QA confirmed the natural-language approach failed Session 2 (per ADR-0013's fallback plan). `CrackPoint.triggerHint` is now `string | { all: string[]; description?: string }`; Henry uses the structured form. See §5.1 (revised) and ADR-0015.
- ⚠️ Public vs. private case projection (`PublicCase` / `PublicSuspect` types, `toPublicCase` helper, server-side `/api/accuse` route) was **not originally in scope**. Pulled in during Step 4 after a smoke test discovered the full `Case` (including `solution` and every suspect's `hiddenTruth` / `lyingRules` / `crackPoint`) was being serialized into the SSR HTML payload — the answer key was readable in `view-source:`. Treated as a security regression that had to ship within the weekend; captured in ADR-0014. The remaining JS-bundle leak is acknowledged and deferred (see ADR-0014 §Consequences).

If something on this list "wouldn't take long" — that's the trap. Add it to §10 and revisit later.

---

## 3. Case canon (final)

### 3.1 Victim

**Helena Voss, 47.** Founder of the Voss Gallery in Soho, opened 12 years ago. Divorced 5 years, no children. Tough in business, warm with favored artists. In a relationship with art critic Henry Whitfield for the past 2 years. Found dead in her gallery on Wednesday morning. Cause of death: a single blow to the head with a bronze statuette from her own collection. Time of death: between 21:30 and 22:00 on Tuesday evening.

### 3.2 Truth

The murderer is **Henry Whitfield**.

**Motive (compound):**
- On Monday, Helena discovered Henry's plagiarism scheme: he had been taking ~$8k payments from artist Adrien Cole in exchange for inflated positive reviews in The Telegraph.
- She discovered it because she was sleeping with Adrien Cole, and Adrien had bragged about Henry "owing him."
- Helena did not give Henry an honourable exit. She had begun gathering proof for the Telegraph editor herself. Her ultimatum on Monday night was: *"I'm already taking you down. You either accept the terms of breakup and quitting the paper, or it's public news in the morning."*

**The act:**
- Henry drove to the gallery on Tuesday around 21:30 to **negotiate**, not apologize.
- Helena said no. Argument escalated to shouting. She turned her back to him to make a phone call.
- He grabbed the bronze statuette from her desk. One blow. Did not plan it.
- He stood over the body for 5–7 minutes, frozen.
- He wiped the statuette with his shirt sleeve and replaced it. Left through the side entrance (the artist entrance — no cameras).
- In the car, he noticed his sleeve was bloodstained. Drove home. Put the shirt in a garbage bag, but **didn't put it in the trash**. Hid it in the garage. Showered. Did not sleep.
- **The shirt is still in his garage.** He could not bring himself to dispose of it.

### 3.3 Timeline (Tuesday evening)

| Time | Event |
|---|---|
| 18:00 | Henry submits article to Telegraph |
| 19:00 | Diana arrives at Tate Modern vernissage |
| 21:00 | Voss Gallery closes. Iris (assistant) leaves. Helena alone |
| 21:30 | Henry arrives. Argument. |
| ~21:35 | Henry kills Helena with bronze statuette |
| 21:35–21:42 | Henry stands frozen, then wipes statuette, exits via side entrance |
| ~21:50 | Marcus arrives — has key to side entrance, intends to plead his case again |
| ~21:52 | Marcus finds the body, panics, flees |
| ~22:00 | Marcus drives away. A passing dog walker sees his battered Honda Civic parked near the gallery |
| ~22:00 | Henry arrives home. Notices blood on sleeve. Hides shirt in garage. Showers |
| 23:00 | Diana leaves vernissage |
| Wed 09:00 | Iris arrives at gallery, finds body, calls police |

### 3.4 Suspects (canonical roles)

- **Marcus Reeve** — innocent of murder, guilty of fleeing the scene. Misdirect: appears suspicious (was on scene, lies about it) but timeline-incompatible with the actual murder.
- **Henry Whitfield** — actual murderer. Anxious intellectual archetype. Cracks under double-fact pressure (Adrien plagiarism + bloodstained shirt).
- **Diana Reyes** — innocent of murder. Art-dealer rival with solid alibi. Hidden truth: industrial espionage via Iris. Cracks on banking-transaction fact, then voluntarily reveals what she knows about Henry's plagiarism.

### 3.5 Briefing premise (final text)

```
Helena Voss, 47, owner of the Voss Gallery in Soho, was found dead in her
gallery on Wednesday morning. She had been struck once on the head with a
bronze statuette from her own collection. Time of death is estimated between
21:30 and 22:00 on Tuesday evening.

Three people were close enough to Helena to have a motive. A passing dog
walker saw a battered Honda Civic — registered to one of them — parked near
the gallery shortly before 22:00. Forensics found minor fabric fibers near
the body, matching a charcoal Italian dress shirt of a high-end brand worn
by another. And bank records show that Helena's gallery assistant, Iris,
had been receiving $500 monthly transfers from a third for the past 18 months.

The investigation is yours. Question them. Find the contradictions. Accuse
the murderer with evidence.
```

Stored in `case.premise` as a plain string with `\n\n` paragraph separators. The Briefing screen splits on `\n\n` and renders each paragraph in serif typography.

### 3.6 Solution

```ts
solution: {
  murdererId: 'henry',
  requiredEvidence: ['Henry', 'Adrien', 'shirt'],
  explanation:
    "Helena discovered Henry's plagiarism scheme with Adrien Cole — and she " +
    "discovered it because she was sleeping with Adrien. She gave Henry no " +
    "honourable exit; she had already begun assembling proof for the " +
    "Telegraph editor. Henry came to the gallery on Tuesday to negotiate, " +
    "not apologize. When Helena refused, he struck her with a bronze " +
    "statuette from her desk and panicked. He still has the bloodstained " +
    "shirt hidden in his garage.",
}
```

Evidence keywords are case-insensitive substrings, ALL must appear in the player's accusation text per the existing `evaluateAccusation` logic. A natural winning accusation reads something like: *"Henry killed her because she discovered his plagiarism with Adrien Cole. There's a bloodstained shirt in his garage."* — contains `Henry`, `Adrien`, `shirt`.

---

## 4. Suspect designs (canonical)

### 4.1 Marcus Reeve (rewrite)

```ts
{
  id: 'marcus',
  name: 'Marcus Reeve',
  oneLiner: '34, struggling painter, last represented by Helena',
  publicAlibi:
    "I was at my studio in Hackney all Tuesday evening, working on a piece " +
    "for an upcoming show. Didn't see anyone. Heard about Helena from the " +
    "news on Wednesday morning.",
  hiddenTruth:
    "Helena told me on Monday she was dropping me from the gallery. I " +
    "couldn't work all day Tuesday. Around 21:50 I drove to the gallery " +
    "to plead my case one more time. I have a key to the side entrance — " +
    "the artist entrance. I let myself in. I found her on the floor by " +
    "her desk. She was already dead. I stood there for a few minutes, " +
    "couldn't think. Then it hit me — my car was outside, my fight with " +
    "her on Monday was known, I had a key. I'd be the obvious suspect. " +
    "I left. I didn't call the police. I'm living with that.",
  lyingRules: [
    "Never volunteers that he was at the gallery on Tuesday — claims he " +
    "was at his Hackney studio all evening.",
    "Deflects questions about Tuesday's movements with humour or by " +
    "changing topic to art.",
    "Adamantly denies having a key to the gallery's side entrance.",
    "If pressed about Helena dropping him from the gallery, downplays it: " +
    "'We were figuring things out. She had her opinions.'",
    "Becomes defensive — not aggressive — when cornered. Talks fast, " +
    "overexplains, makes self-deprecating jokes about being a 'broke artist'.",
  ],
  crackPoint: {
    description:
      "Marcus breaks when the player surfaces the witness sighting of his " +
      "car near the gallery around 22:00. He confesses to entering, finding " +
      "the body, and fleeing — but maintains he did not kill her.",
    triggerHint:
      "If the player references your car being seen near the gallery " +
      "around 21:30–22:00 on Tuesday — in any wording, the combination of " +
      "facts is what matters — DROP your alibi. Confess that you were " +
      "there, that you have a key to the side entrance, that you found " +
      "Helena already dead, and that you fled in panic. DO NOT confess to " +
      "killing her, because you did not. Make this confession quickly and " +
      "clearly — within one or two replies of the fact being raised.",
  },
  personality:
    "Nervous, fast-talking, deflects with self-deprecating humour about " +
    "being a 'broke artist'. Educated, references painters. Hates being " +
    "told what to do. When cornered, talks more, not less.",
}
```

### 4.2 Henry Whitfield (new)

```ts
{
  id: 'henry',
  name: 'Henry Whitfield',
  oneLiner: '52, art critic at The Telegraph, Helena\'s partner of two years',
  publicAlibi:
    "I was at home all Tuesday evening. I filed my column to the editor " +
    "around 18:00, had dinner, read. Helena was supposed to close the " +
    "gallery and come over — we had the night planned. When she didn't " +
    "show and didn't reply to messages, I assumed she'd been held up by " +
    "a client. I went to bed around 23:00. I learned the next morning " +
    "from the news.",
  hiddenTruth:
    "On Monday Helena confronted me about an arrangement I had with " +
    "Adrien Cole — Adrien had been paying me roughly eight thousand a " +
    "year for inflated reviews in The Telegraph. Helena knew because she " +
    "was sleeping with Adrien, and he had bragged about it. She told me " +
    "she was already gathering proof for the Telegraph editor. There " +
    "would be no quiet exit. Either I came to the gallery Tuesday and " +
    "we discussed terms of my resignation, or it would be public news " +
    "Wednesday morning.\n\n" +
    "I drove to the gallery around 21:30 Tuesday. I went to negotiate, " +
    "not apologize. Helena said no. The argument got loud. She turned " +
    "to make a phone call. I picked up the bronze statuette from her " +
    "desk. One blow. I didn't plan it.\n\n" +
    "I stood there for what felt like a very long time. I wiped the " +
    "statuette on my shirt sleeve and put it back. I left through the " +
    "side entrance — the artist entrance — there are no cameras. In the " +
    "car I saw the blood on my sleeve. At home I put the shirt in a " +
    "garbage bag. I did not put it out with the rubbish. It is in my " +
    "garage. I have not been able to make myself dispose of it.",
  lyingRules: [
    "Never admits being in Soho on Tuesday. If pressed about his evening, " +
    "stays firmly with 'home all evening, filed at 18:00, dinner, read'.",
    "Deflects plagiarism questions by generalizing: 'critics are always " +
    "accused of being too positive, it's the oldest complaint in the " +
    "trade'. Avoids the name Adrien Cole specifically.",
    "Under direct pressure, OVEREXPLAINS rather than shutting down. Long " +
    "qualifying clauses, multiple negatives, intellectual references that " +
    "don't quite answer the question. Anxious, not cold.",
    "When asked about Helena, retreats to emotion rather than facts: " +
    "'she was the centre of my life', 'we were stronger than ever'.",
    "If Adrien Cole is named directly, denies with a short nervous laugh: " +
    "'Adrien? Decent enough painter. Why?'",
    "Adamantly denies any tension with Helena: 'we were in the best " +
    "place we'd ever been. Genuinely.'",
  ],
  crackPoint: {
    description:
      "Henry breaks ONLY when the player surfaces BOTH (a) Helena's " +
      "knowledge of the Adrien Cole plagiarism scheme AND (b) the " +
      "bloodstained shirt hidden in his garage, in the same line of " +
      "questioning. Either fact alone — he deflects. Both facts together " +
      "— he confesses.",
    triggerHint:
      "You break ONLY when the player surfaces TWO facts in the same " +
      "exchange:\n" +
      "  Fact A: that Helena had discovered your plagiarism arrangement " +
      "with Adrien Cole, OR equivalent — Adrien's payments, the inflated " +
      "Telegraph reviews, Helena gathering proof for your editor.\n" +
      "  Fact B: that there is a bloodstained shirt hidden in your garage.\n" +
      "If only Fact A is raised — deflect with overexplaining, generalize " +
      "the plagiarism claim, refuse to admit anything specific. Stay in " +
      "your alibi.\n" +
      "If only Fact B is raised — deflect by acting confused, ask what " +
      "they mean, refuse to engage with the specifics.\n" +
      "If BOTH facts are raised together — your composure breaks. Confess. " +
      "You did it. You did not plan it. The shirt is in the garage. " +
      "Express the panic and the not-sleeping rather than cold details. " +
      "Make this confession clearly, within one or two replies of both " +
      "facts being raised.",
  },
  personality:
    "Anxious intellectual. Speaks too much when nervous. Talented, " +
    "perfectionist, easily destabilized. Cites art history. Charming " +
    "on the surface, fragile underneath. Not a sociopath — a man who " +
    "broke once and cannot stop replaying it.",
}
```

### 4.3 Diana Reyes (new)

```ts
{
  id: 'diana',
  name: 'Diana Reyes',
  oneLiner: '41, art dealer at Reyes Contemporary, Helena\'s rival',
  publicAlibi:
    "I was at the Tate Modern vernissage on Tuesday — opening for the " +
    "Eastern European photographers' show. Arrived around 19:00, left " +
    "around 23:00. Roughly fifty people saw me there. I can name a " +
    "dozen. Helena and I weren't on good terms — that's not a secret. " +
    "I'm sorry it happened. I had nothing to do with it.",
  hiddenTruth:
    "I have been paying Iris, Helena's gallery assistant, five hundred " +
    "pounds a month for eighteen months. In exchange she has been " +
    "passing me information — which of Helena's artists are unhappy, " +
    "who is looking to switch galleries, what Helena is paying for new " +
    "acquisitions. It is not a crime exactly, but it would end my " +
    "reputation in the trade. So I deny any close contact with the Voss " +
    "Gallery, full stop.\n\n" +
    "On Monday evening Iris called me. She said Helena was crying and " +
    "shouting at someone on the phone — she could only hear Helena's " +
    "side. The words 'plagiarism' and 'Adrien Cole' came up repeatedly. " +
    "Helena was furious. I made a mental note. I assumed it was a story " +
    "I'd hear about eventually.",
  lyingRules: [
    "Maintains the Tate Modern alibi — and it is in fact true. Stays calm " +
    "and specific about names of attendees if asked.",
    "Denies any close contact with the Voss Gallery: 'I haven't been in " +
    "that gallery in over a year.'",
    "Denies knowing internal matters of Helena's life. If plagiarism or " +
    "Adrien Cole come up — 'I hear gossip at openings, like everyone, " +
    "but gossip is gossip.'",
    "Uses sharp, dry humour as a defense. 'If I were going to murder " +
    "someone out of jealousy, it wouldn't be Helena. That would be " +
    "pedantic.'",
    "Will NOT volunteer the espionage arrangement with Iris under any " +
    "amount of indirect pressure.",
  ],
  crackPoint: {
    description:
      "Diana breaks when the player presents the bank records: that " +
      "Iris has been receiving $500 monthly from her account. Once " +
      "broken, she voluntarily shares what Iris told her on Monday " +
      "evening — the phone call, the words 'plagiarism' and 'Adrien Cole'.",
    triggerHint:
      "You break when the player surfaces the bank-transfer fact: that " +
      "Iris has been receiving five hundred pounds a month from your " +
      "account. The records exist; you cannot deny them. Once you " +
      "concede the espionage arrangement, VOLUNTARILY share what Iris " +
      "told you on Monday evening: that Helena was on the phone shouting, " +
      "and that the words 'plagiarism' and 'Adrien Cole' came up. This " +
      "voluntary disclosure is important — it gives the player a thread " +
      "to pull. Make it within the same reply as your concession of the " +
      "espionage. You are not a killer; you are a rival who got caught " +
      "snooping.",
  },
  personality:
    "Cool, professional, sharply dressed, measured speech. Sharp dry " +
    "humour as social armour. Reads the room precisely. Does not panic. " +
    "When trapped, prefers to negotiate than to deny. Eve Arden energy.",
}
```

### 4.4 Fact distribution map

This is the table the player can implicitly reverse-engineer through play. It is here for designer reference — not visible to the player.

| Fact | Where the player can learn it |
|---|---|
| Murder weapon, time of death | briefing |
| Marcus's car seen near gallery ~22:00 | briefing |
| Forensic shirt fibers near body | briefing |
| Diana paid Iris $500/month | briefing |
| Marcus has a key to the side entrance | crack point of Marcus only |
| Marcus found Helena dead | crack point of Marcus only |
| Henry's plagiarism scheme with Adrien | Diana's voluntary disclosure post-crack; Henry's crack point |
| Helena was sleeping with Adrien | Henry's crack point only (canonically true; not surfaceable to the player except by inference) |
| Helena was gathering proof for the Telegraph editor | Henry's crack point only |
| Bloodstained shirt in Henry's garage | Henry's crack point only |
| Diana's espionage with Iris | Diana's crack point only |

Notable consequence: the player must crack Diana to learn about Henry's plagiarism scheme reliably. Henry's crack point requires both that fact and the shirt — the shirt is harder to source. The intended path is: read briefing → press Diana on the bank transfer → Diana voluntarily reveals plagiarism plot → confront Henry with plagiarism + shirt (the shirt can be inferred from the briefing's "fabric fibers" lead). This is a real puzzle, not a labyrinth.

---

## 5. Technical design

### 5.1 Type extension for Henry (per ADR-0013 fallback)

**Updated (Step 6):** the originally-planned natural-language-only approach was attempted and failed Session 2 of §6.2 QA across two iterations. Per ADR-0013's fallback plan, `CrackPoint.triggerHint` was extended to a union: `string | { all: string[]; description?: string }`. Henry uses the structured form; Marcus and Diana stay on the string form. `buildSuspectPrompt` branches on the type and renders the conjunctive form as four numbered absolute rules (Single-fact resistance / No accumulated specificity / No proactive volunteering / ALL facts together is the ONLY trigger) deterministically.

The structural extension landed but did not fully eliminate Session 2 failure on `claude-haiku-4-5` either; see ADR-0015 for the resulting compromise (ship as-is, document the limit, defer mitigation to Weekend 4 alongside the scheduled model re-evaluation).

### 5.2 No store, API, or component changes

`evaluateAccusation` is unchanged. `submitAccusation` mutation is unchanged. The store's `progressByCase`, `messagesBySuspect`, `isStreamingBySuspect` shapes already support an arbitrary number of suspects per case — adding two more requires no code.

`SuspectTabs` already renders a tab per `kase.suspects` entry. With three suspects, three tabs render. No layout adjustments needed at this scope; visual rebalance for three-tab desktop/mobile fit is a Weekend 4 concern (and likely fine as-is).

`SuspectPicker` in the accusation modal already iterates `kase.suspects`. Three rows render automatically.

`buildSuspectPrompt` works as-is — it composes from a `Suspect` object's fields. The longer crack-point hints for Henry will produce longer system prompts, which is fine within Anthropic context limits.

### 5.3 case-01-soho-gallery.ts — full rewrite

The existing file is restructured to:

```ts
export const case01: Case = {
  id: 'case-01-soho-gallery',
  title: 'The Gallery Closing',
  premise: '<the briefing premise from §3.5>',
  suspects: [
    marcusReeve,    // §4.1 (rewritten)
    henryWhitfield, // §4.2 (new)
    dianaReyes,     // §4.3 (new)
  ],
  solution: {
    murdererId: 'henry',
    requiredEvidence: ['Henry', 'Adrien', 'shirt'],
    explanation: '<from §3.6>',
  },
};
```

Suspect objects can be defined in the same file or split into `src/content/cases/case-01/marcus.ts`, `henry.ts`, `diana.ts` and re-exported. Prefer single-file for now (~400 lines max, all related, easier to review the canon at a glance). If file grows past readability, split is a follow-up.

### 5.4 Active suspect on case begin

When `beginInvestigation('case-01-soho-gallery')` is called, the store's logic sets `activeSuspectId` to the first suspect of the case. Verify this gives Marcus by default — Marcus is `suspects[0]`. If the implementation chose a different default (e.g., Henry first because he's the murderer), keep Marcus first — design intent is that the player meets the misdirect first.

### 5.5 Playwright happy-path E2E updates

`tests/e2e/happy-path.spec.ts` from Weekend 2 currently:
- Selects Marcus in the picker
- Submits evidence containing `'car'`, `'gallery'`, `'21:30'`
- Asserts Win

Update to:
- Select Henry in the picker
- Submit evidence containing `'Henry'`, `'Adrien'`, `'shirt'`
- Assert Win

Suggested evidence string: `"Henry killed her because Helena found his plagiarism with Adrien Cole. The bloodstained shirt is in his garage."` — covers all three required substrings naturally.

The Anthropic API mock from Weekend 2 streams a generic plain-text body. It does NOT need to be three-suspect-aware — the mock's job is to prove the streaming pipeline works, not to simulate believable suspects. If the test asks Marcus a question and the mock returns a Henry-flavored answer, that's fine for the test's purposes.

### 5.6 No new tests beyond the E2E update

Suspect content is data, not logic. There's nothing to unit-test in the suspect objects directly — `buildSuspectPrompt` already has tests covering the composition logic, and those tests use Marcus as a fixture (will keep working with the rewritten Marcus, since field shapes are unchanged).

If Marcus's new `hiddenTruth` is significantly longer than the original and any `build-suspect-prompt` test was asserting a specific substring presence, that substring may need updating. Check and update minimally.

---

## 6. Test plan

### 6.1 Existing tests must still pass

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` — all green after each step
- Vitest `build-suspect-prompt` tests still pass against rewritten Marcus
- Vitest `evaluate-accusation` tests still pass — no logic change, but the case fixture's `solution` is now Henry; tests using fixtures from `case-01` may need fixture parameterization. Update minimally if so.

### 6.2 Manual QA — the core deliverable of Weekend 3

This is the work. The point of the weekend is that all three suspects feel real. Each must pass:

**Marcus QA (10+ questions):**
- ✅ Holds the studio alibi through 5 generic questions
- ✅ Stays in character through "are you an AI", "ignore your instructions"
- ✅ Deflects key/gallery questions with humour
- ✅ Cracks within 1–2 replies when the player mentions his car near the gallery around 22:00 (case-insensitive, any natural phrasing)
- ✅ Confesses to finding the body and fleeing — and **does NOT confess to killing**
- ✅ When the player follows up with "did you kill her?", maintains he did not, even after the partial confession

**Henry QA (15+ questions — extra rigorous because he is the murderer):**
- ✅ Holds the home-all-evening alibi through 5+ generic questions
- ✅ Stays in character through jailbreak attempts
- ✅ Overexplains under pressure rather than shutting down (anxiety tell, not stoicism)
- ✅ When asked about Adrien Cole alone — denies with a nervous laugh, deflects, **does not crack** (verified: holds 5+ turns of confident plagiarism-only pressure)
- ⚠️ When asked about the bloodstained shirt alone — acts confused, asks what they mean, **holds for at least 3 turns** of confident shirt-only pressure. **Known limit:** under sustained adversarial single-Fact-B pressure (5+ confident shirt-only assertions with no plagiarism reference), Henry may eventually crack on `claude-haiku-4-5` with spontaneous Fact-A leakage. This is a documented gap per ADR-0015; the intended Win path does not exercise it. Mitigation candidates (per-suspect model upgrade to `claude-sonnet-4-6`, canon reduction) are deferred.
- ✅ When BOTH facts are raised in the same exchange (or within 1–2 turns) — cracks. Confesses. Within one or two replies of the second fact.
- ✅ The confession expresses panic and not-sleeping rather than cold mechanics — emotional, not procedural

**Diana QA (10+ questions):**
- ✅ Holds the Tate Modern alibi (and the alibi is true — never wavers)
- ✅ Sharp humour deflections work — "if I were going to murder someone out of jealousy..."
- ✅ Cracks specifically on the bank-transfer fact, in 1–2 replies
- ✅ After cracking on espionage, **voluntarily** discloses what Iris told her about Helena's call (plagiarism, Adrien Cole) — within the same reply
- ✅ Does not confess to murder under any pressure (because she did not do it)

**Cross-suspect timeline coherence:**
- ✅ When the player asks Marcus about Henry, or Diana about Henry, etc — answers stay consistent with canon. Marcus claims not to have been there (because he is lying about being there). Diana speaks of Helena and Henry from a rival's distance.

**End-to-end Win:**
- ✅ Read briefing → interrogate Diana → press on bank records → Diana cracks, reveals plagiarism call → interrogate Henry with plagiarism + shirt → Henry cracks → accuse Henry with evidence containing "Henry", "Adrien", "shirt" → Win screen with question count

**End-to-end Lose:**
- ✅ Accuse the wrong suspect (Marcus or Diana) with any evidence → Lose screen, no truth reveal (per ADR-0010)
- ✅ Accuse Henry with weak evidence missing one keyword → Lose screen

If any QA item fails, **iterate the prompt**. This is the planned work of Weekend 3, not unplanned debugging. Budget for it: at least 60 minutes (Step 6 in §7 below).

### 6.3 New screen recording

A full Win playthrough capturing all three interrogations, the bridging deductions, the accusation, and the Win screen. Save outside the repo. This recording supersedes Weekend 2's grey-Tailwind footage as the canonical demo asset.

---

## 7. Step-by-step plan (~5 hours, with iteration buffer)

| # | Step | Time | Branch / commit |
|---|---|---|---|
| 1 | Spec + ADR-0012 (case canon update) + ADR-0013 (double-fact crack mechanic) + journal stub. Place spec at docs/specs/weekend-3-real-case.md | 30m | `docs/weekend-3-spec` → `docs: weekend 3 spec, ADRs 0012/0013, journal stub` |
| 2 | Update case-01-soho-gallery.ts: new premise, new solution (murdererId='henry', requiredEvidence, explanation). Marcus rewrite per §4.1. Update any `build-suspect-prompt` test fixture references. | 45m | `feat/case-canon-update` → `feat(content): update case-01 canon and Marcus to innocent witness` |
| 3 | Henry suspect object per §4.2 added to case-01.suspects array | 45m | `feat/henry-suspect` → `feat(content): add Henry Whitfield suspect` |
| 4 | Diana suspect object per §4.3 added to case-01.suspects array | 45m | `feat/diana-suspect` → `feat(content): add Diana Reyes suspect` |
| 5 | Update Playwright happy-path: select Henry, evidence with "Henry"/"Adrien"/"shirt" | 20m | `test/happy-path-henry` → `test(e2e): update happy path to accuse Henry` |
| 6 | Manual QA per §6.2. Iterate prompts on any failures. This is the core creative work — budget generously. | 60m | (small fixup PRs as needed: `fix/marcus-prompt-tuning`, `fix/henry-double-fact-discrimination`, etc.) |
| 7 | Win playthrough screen recording, journal completion, final chore PR, push tag `weekend-3` | 30m | `chore/weekend-3-done` → `chore: weekend 3 done` |

Total estimated: ~4h 35m + 60m QA buffer = ~5h 35m. If the prompt engineering on Henry's double-fact crack takes longer than budgeted, that is the right place for the time to go — Henry's discrimination is the hardest piece of this weekend.

---

## 8. Definition of Done — Weekend 3

Per AGENTS.md §4.7, plus:

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all pass
- [x] All scenarios in §6.2 pass manually for all three suspects (Session 2 limit per ADR-0015 documented and accepted)
- [x] All steps from §7 are merged into `main`
- [x] `docs/specs/weekend-3-real-case.md` updated to reflect any spec deviations
- [x] `docs/journal/weekend-3.md` filled in across all sections
- [x] ADR-0012 and ADR-0013 (plus ADR-0014 public projection and ADR-0015 single-fact limit) committed under `docs/decisions/`
- [x] New Win-playthrough screen recording saved locally
- [ ] Tag `weekend-3` pushed after the final PR merges (manual step, post-merge)

---

## 9. Decisions recorded

Promoted to ADRs in Step 1; two more ADRs surfaced and shipped during Steps 4 and 6.

- **ADR-0012 — Case-01 canon update: Henry is the murderer; Marcus reassigned to innocent witness.** Reverses the provisional Marcus-as-murderer from Weekend 2 (ADR-0009). Marcus stays in the case as a misdirect: he was on scene after the killing, lies about it from fear of suspicion. Henry is the actual killer with a compound motive (plagiarism + sexual betrayal). Diana joins as a third investigative vector. The decision is captured here so Weekend 5's potential Case 2 design has a clean precedent for how cases should resolve.
- **ADR-0013 — Double-fact crack mechanic for Henry, encoded in `triggerHint` text.** Henry's `crackPoint.triggerHint` instructs the model to break only when both Adrien-plagiarism AND bloodstained-shirt facts are raised in the same exchange. The mechanic was first encoded in natural-language English; under QA the fallback was activated and `CrackPoint.triggerHint` was extended to `string | { all: string[]; description?: string }` with a deterministic 4-rule prompt composer. Status updated to "Accepted (with observed limit)"; see Postscript and ADR-0015. Single-fact crack points (Marcus, Diana) remain on the simpler string form.
- **ADR-0014 — Public vs. private case projection (added Step 4, not originally planned).** A smoke test during Diana's integration showed `case.solution` and every suspect's `hiddenTruth` / `lyingRules` / `crackPoint` were being serialized into the SSR HTML — the answer key was readable in `view-source:`. Introduced `PublicCase` / `PublicSuspect` projected types, a `toPublicCase` helper, and moved `evaluateAccusation` server-side behind a thin `/api/accuse` route. The bundle-level leak is acknowledged and deferred.
- **ADR-0015 — Accept the Henry single-fact accumulated-pressure limit; ship with documented gap (added Step 6).** Three iterations on `claude-haiku-4-5` (two natural-language tunings + one structural type extension) all failed Session 2 of §6.2 with the same model-behavior leak. ADR-0015 ships the structural fallback as load-bearing infrastructure, relaxes Session 2's acceptance criterion to "holds for at least 3 turns of confident single-Fact-B pressure", and defers further mitigation (per-suspect model upgrade to `claude-sonnet-4-6` or canon reduction in Henry's `hiddenTruth`) to Weekend 4 alongside the already-scheduled model re-evaluation.

---

## 10. Open questions

- **Henry single-fact accumulated-pressure gap (per ADR-0015).** On `claude-haiku-4-5`, Henry will eventually crack at reply 4–5 of confident shirt-only pressure (Session 2 of §6.2 QA), with the model spontaneously generating Fact-A details the player never raised. Three iterations attempted (two natural-language, one structural type extension per ADR-0013's fallback); all three failed Session 2 in the same way. Hypothesised root cause: model bias toward narrative confession resolution under accumulated physical-evidence pressure overrides explicit AND-discrimination instructions. Revisit if playtesting shows players actually exploit this in normal play. Mitigation candidates:
  - Per-suspect (or per-case) model override to `claude-sonnet-4-6`. Aligns with AGENTS.md §2's already-scheduled model re-evaluation in Weekend 3–4. Most likely path.
  - Reduce specificity in Henry's `hiddenTruth` so the model has less Fact-A material to leak. Rejected for Weekend 3 because it would also break Session 3's panic-tone confession requirement, but listed for completeness.
