'use client';
import type { SessionPayload } from '@/lib/auth';
import ReferenceHome from '@/components/journey/reference-home';
export default function HomeView({ session }: { session: SessionPayload | null }) {
  return <ReferenceHome session={session} />;
}
