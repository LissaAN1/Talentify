export interface Rating {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateRatingPayload {
  orderId: string;
  score: number;
  comment?: string;
}

export interface ProviderRatingSummary {
  providerId: string;
  average: number;
  count: number;
}
