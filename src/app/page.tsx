import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { InterrogationRoom } from '@/features/interrogation/interrogation-room'
import { SuspectTopBar } from '@/features/interrogation/suspect-top-bar'

export default function Home() {
	const marcus = caseSohoGallery.suspects[0]

	return (
		<div className="flex min-h-screen flex-col">
			<SuspectTopBar suspect={marcus} />
			<InterrogationRoom suspect={marcus} />
		</div>
	)
}
