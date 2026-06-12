-- AlterTable
ALTER TABLE "Product" ADD COLUMN "internalCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_internalCode_key" ON "Product"("storeId", "internalCode");
