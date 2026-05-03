import type { Case, Suspect } from '@/lib/game/types'

const marcus: Suspect = {
	id: 'marcus',
	name: 'Marcus Reeve',
	oneLiner: '34, struggling painter, last represented by Helena',
	publicAlibi:
		'I was at my studio in Hackney all Tuesday evening, working on a piece ' +
		'for an upcoming show. Didn\u2019t see anyone. Heard about Helena from the ' +
		'news on Wednesday morning.',
	hiddenTruth:
		'Helena told me on Monday she was dropping me from the gallery. I ' +
		'couldn\u2019t work all day Tuesday. Around 21:50 I drove to the gallery ' +
		'to plead my case one more time. I have a key to the side entrance \u2014 ' +
		'the artist entrance. I let myself in. I found her on the floor by ' +
		'her desk. She was already dead. I stood there for a few minutes, ' +
		'couldn\u2019t think. Then it hit me \u2014 my car was outside, my fight with ' +
		'her on Monday was known, I had a key. I\u2019d be the obvious suspect. ' +
		'I left. I didn\u2019t call the police. I\u2019m living with that.',
	lyingRules: [
		'Never volunteers that he was at the gallery on Tuesday \u2014 claims he ' +
			'was at his Hackney studio all evening.',
		'Deflects questions about Tuesday\u2019s movements with humour or by ' +
			'changing topic to art.',
		'Adamantly denies having a key to the gallery\u2019s side entrance.',
		'If pressed about Helena dropping him from the gallery, downplays it: ' +
			'\u201cWe were figuring things out. She had her opinions.\u201d',
		'Becomes defensive \u2014 not aggressive \u2014 when cornered. Talks fast, ' +
			'overexplains, makes self-deprecating jokes about being a \u201cbroke artist\u201d.'
	],
	crackPoint: {
		description:
			'Marcus breaks when the player surfaces the witness sighting of his ' +
			'car near the gallery around 22:00. He confesses to entering, finding ' +
			'the body, and fleeing \u2014 but maintains he did not kill her.',
		triggerHint:
			'If the player references your car being seen near the gallery ' +
			'around 21:30\u201322:00 on Tuesday \u2014 in any wording, the combination of ' +
			'facts is what matters \u2014 DROP your alibi. Confess that you were ' +
			'there, that you have a key to the side entrance, that you found ' +
			'Helena already dead, and that you fled in panic. DO NOT confess to ' +
			'killing her, because you did not. Make this confession quickly and ' +
			'clearly \u2014 within one or two replies of the fact being raised.'
	},
	personality:
		'Nervous, fast-talking, deflects with self-deprecating humour about ' +
		'being a \u201cbroke artist\u201d. Educated, references painters. Hates being ' +
		'told what to do. When cornered, talks more, not less.'
}

export const caseSohoGallery: Case = {
	id: 'case-01-soho-gallery',
	title: 'The Gallery Closing',
	premise:
		'Helena Voss, 47, owner of the Voss Gallery in Soho, was found dead in her ' +
		'gallery on Wednesday morning. She had been struck once on the head with a ' +
		'bronze statuette from her own collection. Time of death is estimated between ' +
		'21:30 and 22:00 on Tuesday evening.\n\n' +
		'Three people were close enough to Helena to have a motive. A passing dog ' +
		'walker saw a battered Honda Civic \u2014 registered to one of them \u2014 parked near ' +
		'the gallery shortly before 22:00. Forensics found minor fabric fibers near ' +
		'the body, matching a charcoal Italian dress shirt of a high-end brand worn ' +
		'by another. And bank records show that Helena\u2019s gallery assistant, Iris, ' +
		'had been receiving $500 monthly transfers from a third for the past 18 months.\n\n' +
		'The investigation is yours. Question them. Find the contradictions. Accuse ' +
		'the murderer with evidence.',
	suspects: [marcus],
	solution: {
		// Canonical solution per ADR-0012. Henry is added as a Suspect in Step 3
		// of Weekend 3; until then, case.suspects contains only Marcus and the
		// game is intentionally unwinnable through the UI.
		murdererId: 'henry',
		requiredEvidence: ['Henry', 'Adrien', 'shirt'],
		explanation:
			"Helena discovered Henry's plagiarism scheme with Adrien Cole \u2014 and she " +
			'discovered it because she was sleeping with Adrien. She gave Henry no ' +
			'honourable exit; she had already begun assembling proof for the ' +
			'Telegraph editor. Henry came to the gallery on Tuesday to negotiate, ' +
			'not apologize. When Helena refused, he struck her with a bronze ' +
			'statuette from her desk and panicked. He still has the bloodstained ' +
			'shirt hidden in his garage.'
	}
}
