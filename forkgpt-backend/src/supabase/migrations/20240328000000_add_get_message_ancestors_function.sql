CREATE OR REPLACE FUNCTION get_message_ancestors(leaf_message_id UUID)
RETURNS SETOF messages
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH RECURSIVE ancestors AS (
    -- Base case: start with leaf message
    SELECT m.*
    FROM messages m
    WHERE m.id = leaf_message_id

    UNION ALL

    -- Recursive case: get parent messages
    SELECT m.*
    FROM messages m
    INNER JOIN ancestors a ON m.id = a.parent_id
  )
  SELECT *
  FROM ancestors
  ORDER BY created_at ASC; -- Order from root to leaf
$$; 