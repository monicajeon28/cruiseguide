import TravelBanner from "@/components/TripInfoBanner";
import OnboardingCard from '@/components/OnboardingCard';
import ChatPageClient from '@/components/chat/ChatPageClient';
import { getSessionAndTrip } from '@/lib/session';

// 서버 컴포넌트
export default async function ChatPage() {
  const { user, trip } = await getSessionAndTrip();

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="py-4">
        {user && !trip && <OnboardingCard />}
        {user && trip && <TravelBanner />}
        <ChatPageClient
          initialTrip={trip ? {
            cruiseName: trip.name,
            destinations: [trip.destination],
            start: trip.startDate.toISOString(),
            end: trip.endDate.toISOString(),
          } : undefined}
        />
      </div>
    </main>
  );
}
