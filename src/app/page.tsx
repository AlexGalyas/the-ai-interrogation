import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { GameRoot } from '@/features/game-root/game-root'
import { toPublicCase } from '@/lib/game/to-public-case'

export default function Home() {
	return (
		<main className="min-h-screen">
			<GameRoot kase={toPublicCase(caseSohoGallery)} />
		</main>
	)
}
