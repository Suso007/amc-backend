/*
  Warnings:

  - You are about to drop the column `tax_amount` on the `amc_proposals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "amc_proposals" DROP COLUMN "tax_amount",
ADD COLUMN     "doc_link" TEXT,
ADD COLUMN     "taxamount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "terms_conditions" TEXT;

-- CreateTable
CREATE TABLE "proposal_documents" (
    "id" SERIAL NOT NULL,
    "proposal_no" VARCHAR(50) NOT NULL,
    "doc_link" TEXT NOT NULL,
    "created_by" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_records" (
    "id" SERIAL NOT NULL,
    "proposal_no" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "sent_by" VARCHAR(200) NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_records_pkey" PRIMARY KEY ("id")
);
