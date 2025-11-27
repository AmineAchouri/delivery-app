export type JwtClaims = {
  sub: string;
  typ: 'tenant';
  tenant_id: string;
  roles?: string[];
  perms?: string[];
  iat: number;
  exp: number;
};