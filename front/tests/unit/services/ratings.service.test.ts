import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from "@/services/api-client";
import { ratingsService } from "@/services/ratings.service";

describe("ratingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create hace POST /ratings con el cuerpo recibido", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "r-1" } });

    const result = await ratingsService.create({ orderId: "o-1", score: 5 });

    expect(apiClient.post).toHaveBeenCalledWith("/ratings", { orderId: "o-1", score: 5 });
    expect(result).toEqual({ id: "r-1" });
  });

  it("getProviderSummary hace GET /ratings/provider/:id", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { providerId: "p-1", average: 4.5, count: 2 },
    });

    const result = await ratingsService.getProviderSummary("p-1");

    expect(apiClient.get).toHaveBeenCalledWith("/ratings/provider/p-1");
    expect(result.average).toBe(4.5);
  });
});
