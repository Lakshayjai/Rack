-- AlterTable
ALTER TABLE "Outfit" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
