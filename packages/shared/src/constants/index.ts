export const USER_ROLES = ["ADMIN", "BARBER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BARBER_STATUS = ["AVAILABLE", "WAITING", "IN_SERVICE"] as const;
export type BarberStatus = (typeof BARBER_STATUS)[number];

export const SERVICE_SESSION_STATUS = ["IN_SERVICE", "COMPLETED", "CANCELLED"] as const;
export type ServiceSessionStatus = (typeof SERVICE_SESSION_STATUS)[number];

export const AUDIT_ACTIONS = [
  "SERVICE_STARTED",
  "SERVICE_FINISHED",
  "SERVICE_CANCELLED",
  "SERVICE_CATALOG_CREATED",
  "SERVICE_CATALOG_UPDATED",
  "SERVICE_PRICE_CHANGED",
  "BARBER_CREATED",
  "BARBER_UPDATED",
  "BARBER_DEACTIVATED",
  "USER_LOGIN",
  "TENANT_SETTINGS_UPDATED",
  "TENANT_LOGO_UPDATED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const REPORT_PERIODS = [
  "TODAY",
  "YESTERDAY",
  "THIS_WEEK",
  "LAST_WEEK",
  "THIS_MONTH",
  "LAST_MONTH",
  "LAST_30_DAYS",
  "CUSTOM",
] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const SOCKET_EVENTS = {
  SERVICE_STARTED: "service.started",
  SERVICE_FINISHED: "service.finished",
  SERVICE_CANCELLED: "service.cancelled",
  BARBER_STATUS_CHANGED: "barber.status_changed",
} as const;

export const ACCESS_TOKEN_TTL_MIN = 15;
export const REFRESH_TOKEN_TTL_DAYS = 7;
