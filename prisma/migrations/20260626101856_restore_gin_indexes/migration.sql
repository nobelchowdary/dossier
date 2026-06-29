-- Restore GIN indexes for full-text search (lost in Prisma drift migration)
CREATE INDEX IF NOT EXISTS "Project_searchVector_idx" ON "Project" USING GIN("searchVector");
CREATE INDEX IF NOT EXISTS "Message_searchVector_idx" ON "Message" USING GIN("searchVector");
CREATE INDEX IF NOT EXISTS "Client_searchVector_idx" ON "Client" USING GIN("searchVector");
