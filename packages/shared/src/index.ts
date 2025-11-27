export type ActorScope = 'platform' | 'tenant';

export interface JwtClaims {
  sub: string;
  typ: ActorScope;         // platform | tenant
  tenant_id?: string;      // required for tenant tokens
  roles: string[];         // role names or IDs
  perms?: string[];        // optional permissions
  iat: number;
  exp: number;
  jti?: string;
  ver?: number;
}

export interface TenantContext {
  tenantId: string;
}

export const REQUIRED_TENANT_HEADER = 'X-Tenant-ID' as const;

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Permissions (examples)
export const Permissions = {
  MENU_READ: 'menu.read',
  MENU_WRITE: 'menu.write',
  OFFER_READ: 'offer.read',
  OFFER_WRITE: 'offer.write',
  ORDER_READ: 'order.read',
  ORDER_WRITE: 'order.write',
  ORDER_STATUS_UPDATE: 'order.status.update',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_REFUND: 'payment.refund',
  DELIVERY_TASK_ASSIGN: 'delivery.task.assign',
  DELIVERY_TASK_UPDATE: 'delivery.task.update',
  SETTINGS_READ: 'settings.read',
  SETTINGS_WRITE: 'settings.write',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_LINK: 'media.link',
  ANALYTICS_READ: 'analytics.read'
} as const;