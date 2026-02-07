/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Soldier` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Soldier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ปกติ'
);
INSERT INTO "new_Soldier" ("batch", "department", "fullName", "id") SELECT "batch", "department", "fullName", "id" FROM "Soldier";
DROP TABLE "Soldier";
ALTER TABLE "new_Soldier" RENAME TO "Soldier";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
