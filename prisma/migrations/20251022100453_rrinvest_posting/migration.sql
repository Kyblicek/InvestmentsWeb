-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "scheduledFor" TIMESTAMP(3);
