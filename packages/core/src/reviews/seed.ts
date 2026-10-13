import type { Review } from "./types";

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/**
 * Seeded "recent reviews". The headline rating/count shown on cards comes from
 * the owner aggregate; this list is what the review sections display — the same
 * "4.9 ★ (32) with recent reviews" pattern real apps use.
 */
export const SEED_REVIEWS: Review[] = [
  {
    id: "review_seed_1",
    requestId: "seed_req_marta_1",
    reviewerId: "profile_jordi",
    revieweeId: "profile_marta",
    rating: 5,
    comment: "Marta me dejó el taladro al instante y todo perfecto. ¡Repetiré!",
    createdAt: daysAgo(4),
  },
  {
    id: "review_seed_2",
    requestId: "seed_req_marta_2",
    reviewerId: "profile_nuria",
    revieweeId: "profile_marta",
    rating: 5,
    comment: "Súper amable y flexible con los horarios de recogida.",
    createdAt: daysAgo(12),
  },
  {
    id: "review_seed_3",
    requestId: "seed_req_jordi_1",
    reviewerId: "profile_sam",
    revieweeId: "profile_jordi",
    rating: 5,
    comment: "El proyector funcionaba genial y Jordi explica todo lo necesario.",
    createdAt: daysAgo(9),
  },
  {
    id: "review_seed_4",
    requestId: "seed_req_jordi_2",
    reviewerId: "profile_ainhoa",
    revieweeId: "profile_jordi",
    rating: 4,
    comment: "Todo bien, aunque la sierra venía sin una hoja de repuesto.",
    createdAt: daysAgo(21),
  },
  {
    id: "review_seed_5",
    requestId: "seed_req_ainhoa_1",
    reviewerId: "profile_marta",
    revieweeId: "profile_ainhoa",
    rating: 5,
    comment: "Las clases de inglés son dinámicas y muy útiles. Muy recomendable.",
    createdAt: daysAgo(6),
  },
  {
    id: "review_seed_6",
    requestId: "seed_req_sam_1",
    reviewerId: "profile_nuria",
    revieweeId: "profile_sam",
    rating: 5,
    comment: "La bici de carga salvó mi mudanza. Sam es un crack.",
    createdAt: daysAgo(15),
  },
  {
    id: "review_seed_7",
    requestId: "seed_req_nuria_1",
    reviewerId: "profile_jordi",
    revieweeId: "profile_nuria",
    rating: 5,
    comment: "El kit de paella estaba impecable y trae de todo.",
    createdAt: daysAgo(18),
  },
  {
    id: "review_seed_8",
    requestId: "seed_req_nuria_2",
    reviewerId: "profile_ainhoa",
    revieweeId: "profile_nuria",
    rating: 5,
    comment: "Dejó la casa reluciente. Puntual y muy profesional.",
    createdAt: daysAgo(30),
  },
];
