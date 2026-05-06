import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import {
	applyNervousnessBump,
	applyNervousnessDecay,
	countNervousnessMatches
} from '@/lib/game/nervousness'
import { toPublicCase } from '@/lib/game/to-public-case'
import type {
	Accusation,
	AccusationResult,
	Case,
	NervousnessTriggers,
	PublicCase,
	Suspect
} from '@/lib/game/types'

export interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	/**
	 * Char-by-char render buffer (see ADR-0016 / spec §3.2). For assistant
	 * messages, grows from `''` toward `content` via {@link GameState.tick}; for
	 * user messages, mirrors `content` immediately (no typewriter).
	 */
	displayedContent: string
}

export interface PersistedAccusation {
	suspectId: string
	evidence: string
	result: AccusationResult
	submittedAt: string
}

export interface CaseProgress {
	hasBegun: boolean
	messagesBySuspect: Record<string, Message[]>
	isStreamingBySuspect: Record<string, boolean>
	activeSuspectId: string
	accusation: PersistedAccusation | null
	/** Per-suspect nervousness, 0..100. Missing entries read as 0. See ADR-0017. */
	nervousnessBySuspect: Record<string, number>
}

export type Screen = 'briefing' | 'investigation' | 'outcome'

export const STORAGE_KEY = 'the-ai-interrogation:game:v2'
const STORAGE_VERSION = 2
const PUBLIC_SOHO_GALLERY = toPublicCase(caseSohoGallery)
const DEFAULT_CASE_ID = PUBLIC_SOHO_GALLERY.id

const CASES_BY_ID: Record<string, PublicCase> = {
	[PUBLIC_SOHO_GALLERY.id]: PUBLIC_SOHO_GALLERY
}

const FULL_CASES_BY_ID: Record<string, Case> = {
	[caseSohoGallery.id]: caseSohoGallery
}

export interface GameState {
	currentCaseId: string
	progressByCase: Record<string, CaseProgress>

	getCurrentProgress: () => CaseProgress
	getActiveMessages: () => Message[]
	getQuestionsAskedCount: () => number
	getNervousness: (suspectId: string) => number

	beginInvestigation: (caseId: string) => void
	setActiveSuspect: (suspectId: string) => void
	appendUserMessage: (suspectId: string, content: string) => void
	startAssistantMessage: (suspectId: string) => string
	appendToAssistantMessage: (suspectId: string, id: string, chunk: string) => void
	finishStreaming: (suspectId: string) => void
	tick: (suspectId: string, messageId: string) => void
	skipTypewriter: (suspectId: string, messageId: string) => void
	bumpNervousness: (suspectId: string, message: string) => void
	decayNervousness: (suspectId: string) => void
	submitAccusation: (accusation: Accusation, result: AccusationResult) => void
	resetCurrentCase: () => void
}

function generateId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID()
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function lookupCase(caseId: string): PublicCase {
	const caseDef = CASES_BY_ID[caseId]
	if (!caseDef) {
		throw new Error(`Unknown case id: ${caseId}`)
	}
	return caseDef
}

function lookupFullSuspect(caseId: string, suspectId: string): Suspect | undefined {
	const fullCase = FULL_CASES_BY_ID[caseId]
	if (!fullCase) return undefined
	return fullCase.suspects.find((s) => s.id === suspectId)
}

function lookupTriggers(caseId: string, suspectId: string): NervousnessTriggers | undefined {
	return lookupFullSuspect(caseId, suspectId)?.nervousnessTriggers
}

function blankProgress(caseDef: PublicCase, hasBegun: boolean): CaseProgress {
	const firstSuspectId = caseDef.suspects[0]?.id
	if (!firstSuspectId) {
		throw new Error(`Case ${caseDef.id} has no suspects.`)
	}
	return {
		hasBegun,
		messagesBySuspect: {},
		isStreamingBySuspect: {},
		activeSuspectId: firstSuspectId,
		accusation: null,
		nervousnessBySuspect: {}
	}
}

/**
 * Derives which screen to render from the current case progress.
 *
 * - `outcome` once an accusation has been submitted.
 * - `investigation` once the player has explicitly begun the case.
 * - `briefing` otherwise (including when no progress has been created yet).
 *
 * @param progress Per-case progress, or `undefined` if no progress exists yet.
 * @returns The screen the UI should render.
 */
export function deriveScreen(progress: CaseProgress | undefined): Screen {
	if (!progress) return 'briefing'
	if (progress.accusation !== null) return 'outcome'
	if (progress.hasBegun) return 'investigation'
	return 'briefing'
}

export const useGameStore = create<GameState>()(
	persist(
		(set, get) => ({
			currentCaseId: DEFAULT_CASE_ID,
			progressByCase: {},

			getCurrentProgress: () => {
				const { currentCaseId, progressByCase } = get()
				const progress = progressByCase[currentCaseId]
				if (!progress) {
					throw new Error(
						`No progress for case "${currentCaseId}". Call beginInvestigation first.`
					)
				}
				return progress
			},

			getActiveMessages: () => {
				const progress = get().getCurrentProgress()
				return progress.messagesBySuspect[progress.activeSuspectId] ?? []
			},

			getQuestionsAskedCount: () => {
				const { currentCaseId, progressByCase } = get()
				const progress = progressByCase[currentCaseId]
				if (!progress) return 0
				return Object.values(progress.messagesBySuspect)
					.flat()
					.filter((m) => m.role === 'user').length
			},

			getNervousness: (suspectId) => {
				const { currentCaseId, progressByCase } = get()
				const progress = progressByCase[currentCaseId]
				if (!progress) return 0
				return progress.nervousnessBySuspect[suspectId] ?? 0
			},

			beginInvestigation: (caseId) => {
				const caseDef = lookupCase(caseId)
				set((state) => {
					const existing = state.progressByCase[caseId]
					const next: CaseProgress = existing
						? { ...existing, hasBegun: true }
						: blankProgress(caseDef, true)
					return {
						currentCaseId: caseId,
						progressByCase: { ...state.progressByCase, [caseId]: next }
					}
				})
			},

			setActiveSuspect: (suspectId) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: { ...progress, activeSuspectId: suspectId }
						}
					}
				}),

			appendUserMessage: (suspectId, content) => {
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const existing = progress.messagesBySuspect[suspectId] ?? []
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								messagesBySuspect: {
									...progress.messagesBySuspect,
									[suspectId]: [
										...existing,
										{
											id: generateId(),
											role: 'user',
											content,
											displayedContent: content
										}
									]
								}
							}
						}
					}
				})

				const triggers = lookupTriggers(get().currentCaseId, suspectId)
				if (!triggers) return
				if (countNervousnessMatches(content, triggers) > 0) {
					get().bumpNervousness(suspectId, content)
				} else {
					get().decayNervousness(suspectId)
				}
			},

			startAssistantMessage: (suspectId) => {
				const id = generateId()
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const existing = progress.messagesBySuspect[suspectId] ?? []
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								messagesBySuspect: {
									...progress.messagesBySuspect,
									[suspectId]: [
										...existing,
										{
											id,
											role: 'assistant',
											content: '',
											displayedContent: ''
										}
									]
								},
								isStreamingBySuspect: {
									...progress.isStreamingBySuspect,
									[suspectId]: true
								}
							}
						}
					}
				})
				return id
			},

			appendToAssistantMessage: (suspectId, id, chunk) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const existing = progress.messagesBySuspect[suspectId] ?? []
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								messagesBySuspect: {
									...progress.messagesBySuspect,
									[suspectId]: existing.map((m) =>
										m.id === id ? { ...m, content: m.content + chunk } : m
									)
								}
							}
						}
					}
				}),

			finishStreaming: (suspectId) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								isStreamingBySuspect: {
									...progress.isStreamingBySuspect,
									[suspectId]: false
								}
							}
						}
					}
				}),

			tick: (suspectId, messageId) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const messages = progress.messagesBySuspect[suspectId]
					if (!messages) return state
					let changed = false
					const nextMessages = messages.map((m) => {
						if (m.id !== messageId) return m
						if (m.displayedContent.length >= m.content.length) return m
						changed = true
						return {
							...m,
							displayedContent: m.content.slice(0, m.displayedContent.length + 1)
						}
					})
					if (!changed) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								messagesBySuspect: {
									...progress.messagesBySuspect,
									[suspectId]: nextMessages
								}
							}
						}
					}
				}),

			skipTypewriter: (suspectId, messageId) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const messages = progress.messagesBySuspect[suspectId]
					if (!messages) return state
					let changed = false
					const nextMessages = messages.map((m) => {
						if (m.id !== messageId) return m
						if (m.displayedContent === m.content) return m
						changed = true
						return { ...m, displayedContent: m.content }
					})
					if (!changed) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								messagesBySuspect: {
									...progress.messagesBySuspect,
									[suspectId]: nextMessages
								}
							}
						}
					}
				}),

			bumpNervousness: (suspectId, message) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const triggers = lookupTriggers(caseId, suspectId)
					if (!triggers) return state
					const current = progress.nervousnessBySuspect[suspectId] ?? 0
					const next = applyNervousnessBump(current, message, triggers)
					if (next === current) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								nervousnessBySuspect: {
									...progress.nervousnessBySuspect,
									[suspectId]: next
								}
							}
						}
					}
				}),

			decayNervousness: (suspectId) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					const current = progress.nervousnessBySuspect[suspectId] ?? 0
					if (current === 0) return state
					const next = applyNervousnessDecay(current)
					if (next === current) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								nervousnessBySuspect: {
									...progress.nervousnessBySuspect,
									[suspectId]: next
								}
							}
						}
					}
				}),

			submitAccusation: (accusation, result) =>
				set((state) => {
					const caseId = state.currentCaseId
					const progress = state.progressByCase[caseId]
					if (!progress) return state
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: {
								...progress,
								accusation: {
									suspectId: accusation.suspectId,
									evidence: accusation.evidence,
									result,
									submittedAt: new Date().toISOString()
								}
							}
						}
					}
				}),

			resetCurrentCase: () =>
				set((state) => {
					const caseId = state.currentCaseId
					const caseDef = lookupCase(caseId)
					return {
						progressByCase: {
							...state.progressByCase,
							[caseId]: blankProgress(caseDef, false)
						}
					}
				})
		}),
		{
			name: STORAGE_KEY,
			version: STORAGE_VERSION,
			skipHydration: true,
			storage: createJSONStorage(() =>
				typeof window !== 'undefined'
					? window.localStorage
					: (undefined as unknown as Storage)
			),
			migrate: (persisted, version) => {
				if (version !== STORAGE_VERSION) {
					return {
						currentCaseId: DEFAULT_CASE_ID,
						progressByCase: {}
					} as Partial<GameState> as GameState
				}
				return persisted as GameState
			}
		}
	)
)
