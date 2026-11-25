import { apiClient } from "./api-client";
import type {
  CreateRatingPayload,
  ProviderRatingSummary,
  Rating,
} from "@/interfaces/rating";

export const ratingsService = {
  // POST /ratings (solo el cliente de una orden COMPLETED, una vez por orden)
  async create(payload: CreateRatingPayload): Promise<Rating> {
    const { data } = await apiClient.post<Rating>("/ratings", payload);
    return data;
  },

  // GET /ratings/provider/:providerId -> promedio y cantidad de calificaciones
  async getProviderSummary(providerId: string): Promise<ProviderRatingSummary> {
    const { data } = await apiClient.get<ProviderRatingSummary>(
      `/ratings/provider/${providerId}`,
    );
    return data;
  },
};
