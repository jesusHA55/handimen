import type { Thread, ThreadContext } from "./types";

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export interface SeedThread {
  thread: Thread;
  messages: { senderId: string; body: string; minutesAgo: number; read: boolean }[];
}

/**
 * One seeded conversation so the inbox isn't empty on first load. It matches the
 * seeded incoming request on the demo user's Makita drill.
 */
export const SEED_THREADS: SeedThread[] = [
  {
    thread: {
      id: "thread_seed_marta",
      listingId: "listing_taladro_you",
      listingTitle: "Taladro ligero Makita",
      requestId: "seed_incoming_marta",
      participantA: "profile_you",
      participantB: "profile_marta",
      createdAt: minutesAgo(180),
      updatedAt: minutesAgo(25),
    },
    messages: [
      {
        senderId: "profile_marta",
        body: "¡Hola! ¿El taladro sigue disponible este finde?",
        minutesAgo: 180,
        read: true,
      },
      {
        senderId: "profile_you",
        body: "¡Buenas Marta! Sí, lo tengo libre. Puedes pasar a recogerlo el sábado por la mañana.",
        minutesAgo: 120,
        read: true,
      },
      {
        senderId: "profile_marta",
        body: "Perfecto, ¿te va bien a las 10h en el portal?",
        minutesAgo: 25,
        read: false,
      },
    ],
  },
  {
    thread: {
      id: "thread_seed_sam",
      listingId: "listing_bici_cargo",
      listingTitle: "Bicicleta de carga (cargo bike)",
      requestId: null,
      participantA: "profile_you",
      participantB: "profile_sam",
      createdAt: minutesAgo(1500),
      updatedAt: minutesAgo(1440),
    },
    messages: [
      {
        senderId: "profile_you",
        body: "¿La bici de carga aguanta un sofá pequeño? 😅",
        minutesAgo: 1500,
        read: true,
      },
      {
        senderId: "profile_sam",
        body: "Aguanta hasta 80 kg en la caja. Un sofá de dos plazas entra justo.",
        minutesAgo: 1440,
        read: true,
      },
    ],
  },
];
