import { create } from 'zustand'

export interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
}

export interface GameState {
	messages: Message[]
	isStreaming: boolean
	error: string | null
	appendUserMessage: (content: string) => void
	startAssistantMessage: () => string
	appendToAssistantMessage: (id: string, chunk: string) => void
	finishStreaming: () => void
	setError: (msg: string | null) => void
	retry: () => void
}

function generateId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID()
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useGameStore = create<GameState>((set) => ({
	messages: [],
	isStreaming: false,
	error: null,

	appendUserMessage: (content) =>
		set((state) => ({
			messages: [...state.messages, { id: generateId(), role: 'user', content }],
			error: null
		})),

	startAssistantMessage: () => {
		const id = generateId()
		set((state) => ({
			messages: [...state.messages, { id, role: 'assistant', content: '' }],
			isStreaming: true,
			error: null
		}))
		return id
	},

	appendToAssistantMessage: (id, chunk) =>
		set((state) => ({
			messages: state.messages.map((m) =>
				m.id === id ? { ...m, content: m.content + chunk } : m
			)
		})),

	finishStreaming: () => set({ isStreaming: false }),

	setError: (msg) => set({ error: msg, isStreaming: false }),

	retry: () =>
		set((state) => {
			const last = state.messages[state.messages.length - 1]
			const messages =
				last && last.role === 'assistant' && last.content === ''
					? state.messages.slice(0, -1)
					: state.messages
			return { messages, error: null }
		})
}))
