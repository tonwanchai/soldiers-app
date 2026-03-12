-- CreateTable
CREATE TABLE "Officer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "rank" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ปกติ',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Officer_fullName_key" ON "Officer"("fullName");
