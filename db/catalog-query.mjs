export const catalogQuery = `SELECT jsonb_build_object(
  'items', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.name,i.slug) FROM catalog_public i),'[]'::jsonb),
  'types', COALESCE((SELECT jsonb_agg(jsonb_build_object('key',key,'label',label) ORDER BY label) FROM item_types),'[]'::jsonb),
  'categories', COALESCE((SELECT jsonb_agg(jsonb_build_object('key',v.key,'label',v.label,'description',v.description) ORDER BY v.sort_order,v.key) FROM facet_values v JOIN facets f ON f.id=v.facet_id WHERE f.key='category'),'[]'::jsonb),
  'facets', jsonb_build_object(
    'materials', COALESCE((SELECT jsonb_agg(jsonb_build_object('key',v.key,'label',v.label) ORDER BY v.label) FROM facet_values v JOIN facets f ON f.id=v.facet_id WHERE f.key='material'),'[]'::jsonb),
    'processes', COALESCE((SELECT jsonb_agg(jsonb_build_object('key',v.key,'label',v.label) ORDER BY v.label) FROM facet_values v JOIN facets f ON f.id=v.facet_id WHERE f.key='process'),'[]'::jsonb)),
  'relationships', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'sourceItemId',c.source_item_id,'targetItemId',c.target_item_id,'targetTypeKey',t.key,'verification',c.verification,'notes',c.notes)) FROM compatibility c LEFT JOIN item_types t ON t.id=c.target_type_id JOIN catalog_public source ON source.id=c.source_item_id WHERE c.target_item_id IS NULL OR EXISTS(SELECT 1 FROM catalog_public target WHERE target.id=c.target_item_id)),'[]'::jsonb)
) AS catalog`;
