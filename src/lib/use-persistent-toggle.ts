'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORE_VALUE_ON = '1'
const STORE_VALUE_OFF = '0'

/**
 * In-process subscriber bus. `useSyncExternalStore` calls `subscribe` with a
 * `notify` callback; we keep them per-key so a write to one toggle re-renders
 * every consumer of the same key (e.g. toggle button + audio controller).
 * Cross-tab updates piggyback on the same notifier via a `storage` listener.
 */
const subscribers = new Map<string, Set<() => void>>()
let storageListenerInstalled = false

function notifyAll(storageKey: string): void {
	subscribers.get(storageKey)?.forEach((notify) => {
		notify()
	})
}

function ensureStorageListener(): void {
	if (storageListenerInstalled || typeof window === 'undefined') return
	storageListenerInstalled = true
	window.addEventListener('storage', (event) => {
		if (!event.key) return
		notifyAll(event.key)
	})
}

function subscribe(storageKey: string, notify: () => void): () => void {
	ensureStorageListener()
	let listeners = subscribers.get(storageKey)
	if (!listeners) {
		listeners = new Set()
		subscribers.set(storageKey, listeners)
	}
	listeners.add(notify)
	return () => {
		listeners?.delete(notify)
		if (listeners?.size === 0) subscribers.delete(storageKey)
	}
}

function readClientValue(storageKey: string, defaultValue: boolean): boolean {
	if (typeof window === 'undefined') return defaultValue
	const raw = window.localStorage.getItem(storageKey)
	if (raw === null) return defaultValue
	return raw === STORE_VALUE_ON
}

interface PersistentToggle {
	value: boolean
	setValue: (next: boolean) => void
}

/**
 * SSR-safe persistent boolean toggle backed by `localStorage`, implemented via
 * `useSyncExternalStore` so consumers in the same tab and across tabs all see
 * a consistent value without manual `useEffect` plumbing.
 *
 * On the server (and during the initial client hydration pass) the value is
 * `defaultValue`. Once hydration completes, React re-reads via the snapshot
 * function and the real localStorage value is reflected.
 *
 * `defaultValue` controls the initial value BEFORE anything is persisted —
 * `false` per spec §6.4 / §7.6 (toggles default to Off on first ever visit).
 */
export function usePersistentToggle(
	storageKey: string,
	defaultValue = false
): PersistentToggle {
	const value = useSyncExternalStore(
		(notify) => subscribe(storageKey, notify),
		() => readClientValue(storageKey, defaultValue),
		() => defaultValue
	)

	const setValue = useCallback(
		(next: boolean) => {
			if (typeof window === 'undefined') return
			window.localStorage.setItem(
				storageKey,
				next ? STORE_VALUE_ON : STORE_VALUE_OFF
			)
			notifyAll(storageKey)
		},
		[storageKey]
	)

	return { value, setValue }
}
