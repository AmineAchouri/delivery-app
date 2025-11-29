// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenvSafe = require('dotenv-safe');
dotenvSafe.config({ allowEmptyValues: false });

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtIssuer: process.env.JWT_ISSUER ?? 'delivery-app',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'delivery-clients',
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  webhookSecret: process.env.WEBHOOK_SECRET ?? ''
};