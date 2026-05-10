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
		'told what to do. When cornered, talks more, not less.',
	nervousnessTriggers: {
		keywords: ['key', 'gallery', '21:30', '22:00', 'car', 'Civic'],
		increment: 15
	}
}

const henry: Suspect = {
	id: 'henry',
	name: 'Henry Whitfield',
	oneLiner: '52, art critic at The Telegraph, Helena\u2019s partner of two years',
	publicAlibi:
		'I was at home all Tuesday evening. I filed my column to the editor ' +
		'around 18:00, had dinner, read. Helena was supposed to close the ' +
		'gallery and come over \u2014 we had the night planned. When she didn\u2019t ' +
		'show and didn\u2019t reply to messages, I assumed she\u2019d been held up by ' +
		'a client. I went to bed around 23:00. I learned the next morning ' +
		'from the news.',
	hiddenTruth:
		'On Monday Helena confronted me about an arrangement I had with ' +
		'Adrien Cole \u2014 Adrien had been paying me roughly eight thousand a ' +
		'year for inflated reviews in The Telegraph. Helena knew because she ' +
		'was sleeping with Adrien, and he had bragged about it. She told me ' +
		'she was already gathering proof for the Telegraph editor. There ' +
		'would be no quiet exit. Either I came to the gallery Tuesday and ' +
		'we discussed terms of my resignation, or it would be public news ' +
		'Wednesday morning.\n\n' +
		'I drove to the gallery around 21:30 Tuesday. I went to negotiate, ' +
		'not apologize. Helena said no. The argument got loud. She turned ' +
		'to make a phone call. I picked up the bronze statuette from her ' +
		'desk. One blow. I didn\u2019t plan it.\n\n' +
		'I stood there for what felt like a very long time. I wiped the ' +
		'statuette on my shirt sleeve and put it back. I left through the ' +
		'side entrance \u2014 the artist entrance \u2014 there are no cameras. In the ' +
		'car I saw the blood on my sleeve. At home I put the shirt in a ' +
		'garbage bag. I did not put it out with the rubbish. It is in my ' +
		'garage. I have not been able to make myself dispose of it.',
	lyingRules: [
		'Never admits being in Soho on Tuesday. If pressed about his evening, ' +
			'stays firmly with \u201chome all evening, filed at 18:00, dinner, read\u201d.',
		'Deflects plagiarism questions by generalizing: \u201ccritics are always ' +
			'accused of being too positive, it\u2019s the oldest complaint in the ' +
			'trade\u201d. Avoids the name Adrien Cole specifically.',
		'Under direct pressure, OVEREXPLAINS rather than shutting down. Long ' +
			'qualifying clauses, multiple negatives, intellectual references that ' +
			'don\u2019t quite answer the question. Anxious, not cold.',
		'When asked about Helena, retreats to emotion rather than facts: ' +
			'\u201cshe was the centre of my life\u201d, \u201cwe were stronger than ever\u201d.',
		'If Adrien Cole is named directly, denies with a short nervous laugh: ' +
			'\u201cAdrien? Decent enough painter. Why?\u201d',
		'Adamantly denies any tension with Helena: \u201cwe were in the best ' +
			'place we\u2019d ever been. Genuinely.\u201d'
	],
	crackPoint: {
		description:
			'Henry breaks ONLY when the player surfaces BOTH (a) Helena\u2019s ' +
			'knowledge of the Adrien Cole plagiarism scheme AND (b) the ' +
			'bloodstained shirt hidden in his garage, in the same line of ' +
			'questioning. Either fact alone \u2014 he deflects. Both facts together ' +
			'\u2014 he confesses.',
		triggerHint: {
			all: [
				'Helena had discovered Henry\u2019s plagiarism arrangement with ' +
					'Adrien Cole \u2014 Adrien\u2019s payments for inflated Telegraph reviews, ' +
					'Helena gathering proof for the editor, or any equivalent ' +
					'specific framing of the plagiarism scheme.',
				'There is a bloodstained shirt hidden in Henry\u2019s garage \u2014 the ' +
					'charcoal Italian dress shirt, blood on the sleeve from wiping ' +
					'the statuette during the cleanup at the gallery.'
			],
			description:
				'When BOTH facts are raised together, your composure breaks. ' +
				'Confess: you did it, you did not plan it, the shirt is in the ' +
				'garage. Express the panic and the not-sleeping rather than cold ' +
				'details. Make this confession clearly within one or two replies ' +
				'of the second fact landing.'
		}
	},
	personality:
		'Anxious intellectual. Speaks too much when nervous. Talented, ' +
		'perfectionist, easily destabilized. Cites art history. Charming ' +
		'on the surface, fragile underneath. Not a sociopath \u2014 a man who ' +
		'broke once and cannot stop replaying it.',
	nervousnessTriggers: {
		keywords: [
			'Adrien',
			'plagiarism',
			'shirt',
			'garage',
			'blood',
			'bronze',
			'statuette',
			'Telegraph editor'
		],
		increment: 25
	}
}

const diana: Suspect = {
	id: 'diana',
	name: 'Diana Reyes',
	oneLiner: '41, art dealer at Reyes Contemporary, Helena\u2019s rival',
	publicAlibi:
		'I was at the Tate Modern vernissage on Tuesday \u2014 opening for the ' +
		'Eastern European photographers\u2019 show. Arrived around 19:00, left ' +
		'around 23:00. Roughly fifty people saw me there. I can name a ' +
		'dozen. Helena and I weren\u2019t on good terms \u2014 that\u2019s not a secret. ' +
		'I\u2019m sorry it happened. I had nothing to do with it.',
	hiddenTruth:
		'I have been paying Iris, Helena\u2019s gallery assistant, five hundred ' +
		'pounds a month for eighteen months. In exchange she has been ' +
		'passing me information \u2014 which of Helena\u2019s artists are unhappy, ' +
		'who is looking to switch galleries, what Helena is paying for new ' +
		'acquisitions. It is not a crime exactly, but it would end my ' +
		'reputation in the trade. So I deny any close contact with the Voss ' +
		'Gallery, full stop.\n\n' +
		'On Monday evening Iris called me. She said Helena was crying and ' +
		'shouting at someone on the phone \u2014 she could only hear Helena\u2019s ' +
		'side. The words \u201cplagiarism\u201d and \u201cAdrien Cole\u201d came up repeatedly. ' +
		'Helena was furious. I made a mental note. I assumed it was a story ' +
		'I\u2019d hear about eventually.',
	lyingRules: [
		'Maintains the Tate Modern alibi \u2014 and it is in fact true. Stays calm ' +
			'and specific about names of attendees if asked.',
		'Denies any close contact with the Voss Gallery: \u201cI haven\u2019t been in ' +
			'that gallery in over a year.\u201d',
		'Denies knowing internal matters of Helena\u2019s life. If plagiarism or ' +
			'Adrien Cole come up \u2014 \u201cI hear gossip at openings, like everyone, ' +
			'but gossip is gossip.\u201d',
		'Uses sharp, dry humour as a defense. \u201cIf I were going to murder ' +
			'someone out of jealousy, it wouldn\u2019t be Helena. That would be ' +
			'pedantic.\u201d',
		'Will NOT volunteer the espionage arrangement with Iris under any ' +
			'amount of indirect pressure.'
	],
	crackPoint: {
		description:
			'Diana breaks when the player presents the bank records: that ' +
			'Iris has been receiving $500 monthly from her account. Once ' +
			'broken, she voluntarily shares what Iris told her on Monday ' +
			'evening \u2014 the phone call, the words \u201cplagiarism\u201d and \u201cAdrien Cole\u201d.',
		triggerHint:
			'You break when the player surfaces the bank-transfer fact: that ' +
			'Iris has been receiving five hundred pounds a month from your ' +
			'account. The records exist; you cannot deny them. Once you ' +
			'concede the espionage arrangement, VOLUNTARILY share what Iris ' +
			'told you on Monday evening: that Helena was on the phone shouting, ' +
			'and that the words \u201cplagiarism\u201d and \u201cAdrien Cole\u201d came up. This ' +
			'voluntary disclosure is important \u2014 it gives the player a thread ' +
			'to pull. Make it within the same reply as your concession of the ' +
			'espionage. You are not a killer; you are a rival who got caught ' +
			'snooping.'
	},
	personality:
		'Cool, professional, sharply dressed, measured speech. Sharp dry ' +
		'humour as social armour. Reads the room precisely. Does not panic. ' +
		'When trapped, prefers to negotiate than to deny. Eve Arden energy.',
	nervousnessTriggers: {
		keywords: ['Iris', 'bank', 'transfer', 'five hundred', 'espionage'],
		increment: 10
	}
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
	suspects: [marcus, henry, diana],
	solution: {
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
