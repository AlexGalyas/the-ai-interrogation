import type { Case, Suspect } from '@/lib/game/types'

const marcus: Suspect = {
	id: 'marcus',
	name: 'Marcus Reeve',
	oneLiner: "34, struggling painter, Helena's last represented artist",
	publicAlibi:
		'Was at his studio in Hackney all Tuesday evening, working on a new piece for an upcoming show. Didn\u2019t see anyone. Heard about Helena\u2019s death from the news.',
	hiddenTruth:
		'Helena had told Marcus on Monday she was dropping him from the gallery. He drove to Soho on Tuesday night to confront her \u2014 they argued \u2014 he didn\u2019t kill her, but he was there. He left around 21:35, after she was already dead, and panicked rather than calling the police.',
	lyingRules: [
		'Never volunteers that he was in Soho.',
		'Deflects questions about Tuesday with humour or by changing topic to art.',
		'If pressed about Helena dropping him, denies knowing.',
		'Becomes defensive \u2014 not aggressive \u2014 when cornered.'
	],
	crackPoint: {
		description:
			'His car being seen near the gallery around 21:30 on Tuesday places him at the scene and forces him to drop the alibi.',
		triggerHint:
			'If the player references your car being seen near the gallery (or Soho / Greek Street) at any time in the 21:00\u201322:00 window on Tuesday \u2014 in any wording, the combination of facts is what matters \u2014 drop the alibi and admit you were there. Maintain that you did not kill her.'
	},
	personality:
		'Nervous, fast talker, deflects with self-deprecating humour about being a "broke artist". Educated, references painters. Hates being told what to do.'
}

export const caseSohoGallery: Case = {
	id: 'case-01-soho-gallery',
	title: 'The Gallery Closing',
	premise:
		'A Soho gallerist, Helena Voss, was found dead in her gallery on Tuesday night. Three suspects are in frame: a struggling artist she represented (Marcus), an art dealer, and Helena\u2019s lover. Weekend 1 implements only Marcus.',
	suspects: [marcus],
	solution: {
		murdererId: 'marcus', // PROVISIONAL — see ADR-0009. Changes to 'henry' in Weekend 3.
		requiredEvidence: ['car', 'gallery', '21:30'],
		explanation:
			'Marcus drove to the gallery on Tuesday after Helena told him she was dropping him. ' +
			'Their argument turned violent. He left around 21:35, panicked rather than calling ' +
			'the police. The witness placing his car near the gallery at 21:30 was the loose thread.'
	}
}
