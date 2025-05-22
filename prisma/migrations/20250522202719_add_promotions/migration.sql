-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE_DISCOUNT', 'FIXED_AMOUNT_DISCOUNT', 'FREE_ITEM', 'BUY_ONE_GET_ONE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "appliedPromotionId" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promotionType" "PromotionType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "minimumOrderValue" DECIMAL(65,30),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "freeItemId" TEXT,
    "couponCode" TEXT,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "applyToAllItems" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryPromotions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryPromotions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MenuItemPromotions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MenuItemPromotions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_couponCode_key" ON "Promotion"("couponCode");

-- CreateIndex
CREATE INDEX "_CategoryPromotions_B_index" ON "_CategoryPromotions"("B");

-- CreateIndex
CREATE INDEX "_MenuItemPromotions_B_index" ON "_MenuItemPromotions"("B");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_appliedPromotionId_fkey" FOREIGN KEY ("appliedPromotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_freeItemId_fkey" FOREIGN KEY ("freeItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryPromotions" ADD CONSTRAINT "_CategoryPromotions_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryPromotions" ADD CONSTRAINT "_CategoryPromotions_B_fkey" FOREIGN KEY ("B") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemPromotions" ADD CONSTRAINT "_MenuItemPromotions_A_fkey" FOREIGN KEY ("A") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemPromotions" ADD CONSTRAINT "_MenuItemPromotions_B_fkey" FOREIGN KEY ("B") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
