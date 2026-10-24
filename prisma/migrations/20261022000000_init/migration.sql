-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CRAFT', 'GAME', 'MOVEMENT', 'THINKING', 'KITCHEN');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('HOME', 'OUTDOOR');

-- CreateEnum
CREATE TYPE "Cost" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" VARCHAR(50) NOT NULL,
    "role" "Role" NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "category" "Category" NOT NULL,
    "location" "Location" NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "cost" "Cost" NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" INTEGER NOT NULL,
    "familyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_parentId_idx" ON "User"("parentId");

-- CreateIndex
CREATE INDEX "Activity_familyId_idx" ON "Activity"("familyId");

-- CreateIndex
CREATE INDEX "Activity_createdById_idx" ON "Activity"("createdById");

-- CreateIndex
CREATE INDEX "Activity_status_isPublic_idx" ON "Activity"("status", "isPublic");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity constraints (אילוצי תקינות ברמת מסד הנתונים)
ALTER TABLE "User" ADD CONSTRAINT "User_child_has_parent_check"
    CHECK (("role" = 'CHILD' AND "parentId" IS NOT NULL) OR ("role" = 'PARENT' AND "parentId" IS NULL));

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_age_range_check"
    CHECK ("minAge" >= 0 AND "maxAge" <= 18 AND "minAge" <= "maxAge");

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_duration_check"
    CHECK ("durationMinutes" BETWEEN 1 AND 600);

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_pending_is_private_check"
    CHECK ("status" = 'APPROVED' OR "isPublic" = false);
