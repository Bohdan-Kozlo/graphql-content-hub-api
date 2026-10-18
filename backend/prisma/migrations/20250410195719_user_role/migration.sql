/*
  Warnings:

  - Changed the column `role` on the `User` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
-- Створити тимчасову колонку з типом Role[]
ALTER TABLE "User" ADD COLUMN "role_tmp" "Role"[];

UPDATE "User" SET "role_tmp" = ARRAY["role"];

ALTER TABLE "User" DROP COLUMN "role";

ALTER TABLE "User" RENAME COLUMN "role_tmp" TO "role";
