-- CreateEnum
CREATE TYPE "PropertyReviewKind" AS ENUM ('approved', 'rejected', 'unpublished', 'resubmitted');

-- CreateTable
CREATE TABLE "PropertyReviewAction" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "adminId" TEXT,
    "action" "PropertyReviewKind" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyReviewAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyReviewAction_propertyId_createdAt_idx" ON "PropertyReviewAction"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "PropertyReviewAction" ADD CONSTRAINT "PropertyReviewAction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyReviewAction" ADD CONSTRAINT "PropertyReviewAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
