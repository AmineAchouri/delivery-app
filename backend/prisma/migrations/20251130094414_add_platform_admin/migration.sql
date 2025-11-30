-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "admin_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "PlatformAdminTenant" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "PlatformAdminTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdminRefreshToken" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "PlatformAdminRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdminTenant_admin_id_tenant_id_key" ON "PlatformAdminTenant"("admin_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdminRefreshToken_token_hash_key" ON "PlatformAdminRefreshToken"("token_hash");

-- CreateIndex
CREATE INDEX "PlatformAdminRefreshToken_admin_id_idx" ON "PlatformAdminRefreshToken"("admin_id");

-- AddForeignKey
ALTER TABLE "PlatformAdmin" ADD CONSTRAINT "PlatformAdmin_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "PlatformAdmin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAdminTenant" ADD CONSTRAINT "PlatformAdminTenant_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "PlatformAdmin"("admin_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAdminTenant" ADD CONSTRAINT "PlatformAdminTenant_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAdminRefreshToken" ADD CONSTRAINT "PlatformAdminRefreshToken_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "PlatformAdmin"("admin_id") ON DELETE CASCADE ON UPDATE CASCADE;
