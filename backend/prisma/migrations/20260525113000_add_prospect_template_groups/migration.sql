ALTER TABLE "ProspectTemplate"
  ADD COLUMN "parentTheme" TEXT,
  ADD COLUMN "flowColor" TEXT;

CREATE INDEX "ProspectTemplate_parentTheme_flowCategory_stepOrder_idx"
  ON "ProspectTemplate"("parentTheme", "flowCategory", "stepOrder");
