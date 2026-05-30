ALTER TABLE "ProspectTemplate"
  ADD COLUMN "flowCategory" TEXT,
  ADD COLUMN "stepOrder" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "delaySeconds" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ProspectTemplate_flowCategory_stepOrder_idx"
  ON "ProspectTemplate"("flowCategory", "stepOrder");
