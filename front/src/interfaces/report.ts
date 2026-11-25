export interface RevenueByMonth {
  month: string; // "2026-11"
  revenue: number;
}

export interface TopService {
  id: string;
  title: string;
  sales: number;
  revenue: number;
}

export interface OrdersByMonthAndStatus {
  month: string;
  status: string;
  total: number;
}

export interface ReportSummary {
  revenueByMonth: RevenueByMonth[];
  topServices: TopService[];
  ordersByMonthAndStatus: OrdersByMonthAndStatus[];
}
