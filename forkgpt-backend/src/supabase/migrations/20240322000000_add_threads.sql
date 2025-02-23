-- Add threads table to track conversation branches
create table threads (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  leaf_message_id uuid references messages(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index threads_topic_id_idx on threads(topic_id);
create index threads_leaf_message_id_idx on threads(leaf_message_id);
create index threads_user_id_idx on threads(user_id);

-- Add trigger for updated_at
create trigger threads_updated_at
  before update on threads
  for each row
  execute function update_updated_at();

-- RLS policies for threads
alter table threads enable row level security;

create policy "Users can view their own threads"
  on threads for select
  using (user_id = auth.uid());

create policy "Users can create threads in their topics"
  on threads for insert
  with check (
    exists (
      select 1 from topics
      where topics.id = threads.topic_id
      and topics.user_id = auth.uid()
    )
  );

create policy "Users can update their own threads"
  on threads for update
  using (user_id = auth.uid());

create policy "Users can delete their own threads"
  on threads for delete
  using (user_id = auth.uid()); 