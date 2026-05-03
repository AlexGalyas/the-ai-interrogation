import { NextResponse } from 'next/server'

import { handle } from '@/api/accuse/handler'
import { AccuseRequestSchema } from '@/api/accuse/schema'

export async function POST(request: Request): Promise<Response> {
	let rawBody: unknown
	try {
		rawBody = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
	}

	const parsed = AccuseRequestSchema.safeParse(rawBody)
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid request', issues: parsed.error.issues },
			{ status: 400 }
		)
	}

	try {
		const result = handle(parsed.data)
		return NextResponse.json(result)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: 'Internal error', detail: message }, { status: 500 })
	}
}
