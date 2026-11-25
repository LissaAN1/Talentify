import { apiClient } from "./api-client";
import type { ReportSummary } from "@/interfaces/report";

export const reportsService = {
  // GET /reports/summary (PROVIDER ve lo suyo, ADMIN ve todo)
  async getSummary(): Promise<ReportSummary> {
    const { data } = await apiClient.get<ReportSummary>("/reports/summary");
    return data;
  },
};
