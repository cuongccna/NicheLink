-- Migration to align schema with TypeScript code expectations

-- Add missing fields to EscrowContract
ALTER TABLE "escrow_contracts" 
ADD COLUMN "projectTitle" VARCHAR(255),
ADD COLUMN "description" TEXT,
ADD COLUMN "contractNumber" VARCHAR(50) UNIQUE,
ADD COLUMN "payerId" VARCHAR(191),
ADD COLUMN "payeeId" VARCHAR(191),
ADD COLUMN "activatedAt" TIMESTAMP(3),
ADD COLUMN "title" VARCHAR(255);

-- Add missing fields to EscrowMilestone
ALTER TABLE "escrow_milestones"
ADD COLUMN "milestoneNumber" INTEGER,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "type" VARCHAR(50) DEFAULT 'STANDARD';

-- Add missing fields to Payment
ALTER TABLE "payments"
ADD COLUMN "externalPaymentId" VARCHAR(255);

-- Add missing fields to FundRelease
ALTER TABLE "fund_releases"
ADD COLUMN "currency" VARCHAR(10) DEFAULT 'USD';

-- Update EscrowStatus enum to include missing values
ALTER TYPE "EscrowStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "EscrowStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "EscrowStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "EscrowStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

-- Update PaymentMethod enum to include missing values  
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'STRIPE';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CRYPTO';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_escrow_contract_number" ON "escrow_contracts"("contractNumber");
CREATE INDEX IF NOT EXISTS "idx_escrow_milestone_number" ON "escrow_milestones"("milestoneNumber");
CREATE INDEX IF NOT EXISTS "idx_payment_external_id" ON "payments"("externalPaymentId");

-- Add foreign key constraints
ALTER TABLE "escrow_contracts" 
ADD CONSTRAINT "fk_escrow_payer" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE SET NULL,
ADD CONSTRAINT "fk_escrow_payee" FOREIGN KEY ("payeeId") REFERENCES "users"("id") ON DELETE SET NULL;

-- Update milestone relation to include foreign key to escrow contract through milestone
CREATE TABLE IF NOT EXISTS "milestone_fund_releases" (
    "id" VARCHAR(191) NOT NULL PRIMARY KEY,
    "milestoneId" VARCHAR(191) NOT NULL,
    "fundReleaseId" VARCHAR(191) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_milestone_fund_release_milestone" FOREIGN KEY ("milestoneId") REFERENCES "escrow_milestones"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_milestone_fund_release_fund" FOREIGN KEY ("fundReleaseId") REFERENCES "fund_releases"("id") ON DELETE CASCADE
);

-- Create unique index for milestone-fund release relationship
CREATE UNIQUE INDEX IF NOT EXISTS "idx_milestone_fund_release_unique" ON "milestone_fund_releases"("milestoneId", "fundReleaseId");
