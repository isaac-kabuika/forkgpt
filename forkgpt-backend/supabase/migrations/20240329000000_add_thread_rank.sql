-- Add rank column to threads table
alter table threads 
  add column rank decimal not null default 1000;

-- Add index for efficient ordering by rank within a topic
create index threads_topic_rank_idx on threads(topic_id, rank);

-- Update existing threads with sequential ranks
with ranked_threads as (
  select 
    id,
    row_number() over (partition by topic_id order by created_at) * 1000 as new_rank
  from threads
)
update threads
set rank = ranked_threads.new_rank
from ranked_threads
where threads.id = ranked_threads.id; 