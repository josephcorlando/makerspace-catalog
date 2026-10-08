CREATE TABLE item_kinds (key text PRIMARY KEY, label text NOT NULL);
CREATE TABLE item_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL, label text NOT NULL,
  parent_id uuid REFERENCES item_types(id) ON DELETE RESTRICT, CHECK(parent_id IS DISTINCT FROM id)
);
CREATE FUNCTION prevent_type_cycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.parent_id IS NOT NULL AND EXISTS (
   WITH RECURSIVE ancestors AS (
     SELECT id,parent_id FROM item_types WHERE id=NEW.parent_id
     UNION SELECT t.id,t.parent_id FROM item_types t JOIN ancestors a ON t.id=a.parent_id
   ) SELECT 1 FROM ancestors WHERE id=NEW.id
 ) THEN RAISE EXCEPTION 'Item type hierarchy cannot contain cycles'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER item_types_no_cycles BEFORE INSERT OR UPDATE OF parent_id ON item_types FOR EACH ROW EXECUTE FUNCTION prevent_type_cycle();
CREATE TABLE catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK(length(trim(name))>0), brand text, model text,
  kind text NOT NULL REFERENCES item_kinds(key), item_type_id uuid NOT NULL REFERENCES item_types(id),
  description text, aliases text[] NOT NULL DEFAULT '{}', metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  CHECK(jsonb_typeof(metadata)='object')
);
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
CREATE TRIGGER catalog_items_updated BEFORE UPDATE ON catalog_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE INDEX catalog_item_type_idx ON catalog_items(item_type_id);
CREATE INDEX catalog_item_kind_idx ON catalog_items(kind) WHERE archived_at IS NULL;
CREATE TABLE facets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL, label text NOT NULL);
CREATE TABLE facet_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), facet_id uuid NOT NULL REFERENCES facets(id),
  key text NOT NULL, label text NOT NULL, description text, sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(facet_id,key)
);
CREATE TABLE item_facet_values (
  item_id uuid NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  facet_value_id uuid NOT NULL REFERENCES facet_values(id), PRIMARY KEY(item_id,facet_value_id)
);
CREATE INDEX item_facet_value_reverse_idx ON item_facet_values(facet_value_id,item_id);
CREATE TABLE compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_item_id uuid NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  target_item_id uuid REFERENCES catalog_items(id), target_type_id uuid REFERENCES item_types(id),
  verification text NOT NULL DEFAULT 'unverified' CHECK(verification IN ('verified','unverified')), notes text,
  CHECK(num_nonnulls(target_item_id,target_type_id)=1), CHECK(source_item_id IS DISTINCT FROM target_item_id)
);
CREATE UNIQUE INDEX compatibility_item_unique ON compatibility(source_item_id,target_item_id) WHERE target_item_id IS NOT NULL;
CREATE UNIQUE INDEX compatibility_type_unique ON compatibility(source_item_id,target_type_id) WHERE target_type_id IS NOT NULL;
CREATE INDEX compatibility_item_reverse_idx ON compatibility(target_item_id);
CREATE INDEX compatibility_type_reverse_idx ON compatibility(target_type_id);
-- Public projection excludes import provenance and private future metadata.
CREATE VIEW catalog_public AS
SELECT i.id,i.slug,i.name,i.brand,i.model,i.kind,t.key AS "typeKey",i.description,i.aliases,
  ARRAY(SELECT v.key FROM item_facet_values j JOIN facet_values v ON v.id=j.facet_value_id JOIN facets f ON f.id=v.facet_id WHERE j.item_id=i.id AND f.key='material' ORDER BY v.key) AS materials,
  ARRAY(SELECT v.key FROM item_facet_values j JOIN facet_values v ON v.id=j.facet_value_id JOIN facets f ON f.id=v.facet_id WHERE j.item_id=i.id AND f.key='process' ORDER BY v.key) AS processes,
  ARRAY(SELECT v.key FROM item_facet_values j JOIN facet_values v ON v.id=j.facet_value_id JOIN facets f ON f.id=v.facet_id WHERE j.item_id=i.id AND f.key='category' ORDER BY v.sort_order,v.key) AS categories
FROM catalog_items i JOIN item_types t ON t.id=i.item_type_id WHERE i.archived_at IS NULL;
