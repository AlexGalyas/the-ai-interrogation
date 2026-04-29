import { z } from 'zod'

export const InterrogateRequestSchema = z.object({
	suspectId: z.string().min(1),
	messages: z
		.array(
			z.object({
				role: z.enum(['user', 'assistant']),
				content: z.string().min(1)
			})
		)
		.min(1)
})

export type InterrogateRequest = z.infer<typeof InterrogateRequestSchema>
