import type {
  UserRole,
  BarberStatus,
  ServiceSessionStatus,
} from "../constants";

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  businessHours: string | null;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface ServiceCatalogItem {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: string | null;
  durationEstimateMin: number;
  currentPrice: string;
  isActive: boolean;
}

export interface BarberSummary {
  id: string;
  tenantId: string;
  displayName: string;
  isAvailable: boolean;
  currentStatus: BarberStatus;
  commissionPercent: string;
  activeSession: ActiveServiceSession | null;
}

export interface ActiveServiceSession {
  id: string;
  serviceId: string;
  serviceName: string;
  startedAt: string;
  clientNameFree: string | null;
}

export interface ServiceSessionRecord {
  id: string;
  tenantId: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clientNameFree: string | null;
  observations: string | null;
  priceAtStart: string;
  commissionPercentAtCompletion: string | null;
  barberEarning: string | null;
  businessEarning: string | null;
  status: ServiceSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  cancelReason: string | null;
}

export interface DashboardLiveSnapshot {
  barbers: BarberSummary[];
  kpis: {
    servicesToday: number;
    servicesInProgress: number;
    barbersActive: number;
    barbersAvailable: number;
    revenueToday: string;
    businessEarningToday: string;
  };
}

export interface ReportSummary {
  range: { from: string; to: string };
  totals: {
    servicesCount: number;
    revenue: string;
    avgTicket: string;
    avgDurationSeconds: number;
    barberEarning: string;
    businessEarning: string;
  };
  byBarber: Array<{
    barberId: string;
    barberName: string;
    servicesCount: number;
    revenue: string;
    avgDurationSeconds: number;
    barberEarning: string;
    businessEarning: string;
  }>;
  byService: Array<{
    serviceId: string;
    serviceName: string;
    servicesCount: number;
    revenue: string;
  }>;
  byHour: Array<{ hour: number; servicesCount: number }>;
  topService: { serviceId: string; serviceName: string; servicesCount: number } | null;
  topBarberByServices: { barberId: string; barberName: string; servicesCount: number } | null;
  topBarberByRevenue: { barberId: string; barberName: string; revenue: string } | null;
}
