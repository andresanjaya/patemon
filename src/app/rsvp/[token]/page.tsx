import type { Metadata } from "next";
import { getRsvpGuestDetails } from "@/features/guests/rsvp-actions";
import { RsvpClient } from "./rsvp-client";

export const metadata: Metadata = {
  title: "Konfirmasi Kehadiran (RSVP) — Patemon",
  description:
    "Konfirmasi kehadiran dan doa restu upacara Pawiwahan Hindu Bali.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

interface RsvpPageProps {
  params: Promise<{ token: string }>;
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { token } = await params;
  const initialResult = await getRsvpGuestDetails(token);

  return <RsvpClient initialResult={initialResult} token={token} />;
}
