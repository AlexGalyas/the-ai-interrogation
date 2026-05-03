import { z } from 'zod'

export const AccuseRequestSchema = z.object({
	suspectId: z.string().min(1),
	evidence: z.string()
})

export type AccuseRequest = z.infer<typeof AccuseRequestSchema>
