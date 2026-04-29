import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery';
import { InterrogationRoom } from '@/features/interrogation/InterrogationRoom';
import { SuspectTopBar } from '@/features/interrogation/SuspectTopBar';

export default function Home() {
  const marcus = caseSohoGallery.suspects[0];

  return (
    <div className="flex min-h-screen flex-col">
      <SuspectTopBar suspect={marcus} />
      <InterrogationRoom suspect={marcus} />
    </div>
  );
}
