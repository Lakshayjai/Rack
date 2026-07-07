-- AlterTable
ALTER TABLE "ClothingItem" ADD COLUMN     "pairedItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
