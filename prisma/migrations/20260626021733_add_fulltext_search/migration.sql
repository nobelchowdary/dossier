-- Add tsvector columns for full-text search

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Populate existing rows
UPDATE "Project" SET "searchVector" = to_tsvector('english',
  coalesce(name, '') || ' ' || coalesce(description, '')
);

UPDATE "Message" SET "searchVector" = to_tsvector('english',
  coalesce(body, '')
);

UPDATE "Client" SET "searchVector" = to_tsvector('english',
  coalesce("companyName", '') || ' ' || coalesce("contactName", '') || ' ' || coalesce("contactEmail", '')
);

-- Create GIN indexes for fast search
CREATE INDEX IF NOT EXISTS "Project_searchVector_idx" ON "Project" USING GIN("searchVector");
CREATE INDEX IF NOT EXISTS "Message_searchVector_idx" ON "Message" USING GIN("searchVector");
CREATE INDEX IF NOT EXISTS "Client_searchVector_idx" ON "Client" USING GIN("searchVector");

-- Triggers to keep searchVector up to date on Project
CREATE OR REPLACE FUNCTION project_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_search_vector_trigger ON "Project";
CREATE TRIGGER project_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Project"
  FOR EACH ROW EXECUTE FUNCTION project_search_vector_update();

-- Triggers to keep searchVector up to date on Message
CREATE OR REPLACE FUNCTION message_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english',
    coalesce(NEW.body, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_search_vector_trigger ON "Message";
CREATE TRIGGER message_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Message"
  FOR EACH ROW EXECUTE FUNCTION message_search_vector_update();

-- Triggers to keep searchVector up to date on Client
CREATE OR REPLACE FUNCTION client_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english',
    coalesce(NEW."companyName", '') || ' ' || coalesce(NEW."contactName", '') || ' ' || coalesce(NEW."contactEmail", '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_search_vector_trigger ON "Client";
CREATE TRIGGER client_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Client"
  FOR EACH ROW EXECUTE FUNCTION client_search_vector_update();
