-- AlterTable
ALTER TABLE "User" ADD COLUMN "permissions" TEXT;

-- Backfill: keep existing non-admin users with the previous default access set
UPDATE "User"
SET "permissions" = '["/pdv","/comandas","/caixa","/producao","/ia"]'
WHERE "role" <> 'admin' AND "permissions" IS NULL;
