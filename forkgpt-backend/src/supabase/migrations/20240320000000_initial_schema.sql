-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Topics table
create table topics (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table with tree structure
create table messages (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references topics(id) on delete cascade,
  parent_id uuid references messages(id) on delete cascade,
  content text not null,
  role text not null check (role in ('user', 'assistant')),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index messages_topic_id_idx on messages(topic_id);
create index messages_parent_id_idx on messages(parent_id);
create index topics_user_id_idx on topics(user_id);
create index messages_user_id_idx on messages(user_id);

-- Update timestamps trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger topics_updated_at
  before update on topics
  for each row
  execute function update_updated_at();

create trigger messages_updated_at
  before update on messages
  for each row
  execute function update_updated_at();

-- Row Level Security (RLS) policies
alter table topics enable row level security;
alter table messages enable row level security;

-- Topics RLS policies
create policy "Users can view their own topics"
  on topics for select
  using (user_id = auth.uid());

create policy "Users can create their own topics"
  on topics for insert
  with check (user_id = auth.uid());

create policy "Users can update their own topics"
  on topics for update
  using (user_id = auth.uid());

create policy "Users can delete their own topics"
  on topics for delete
  using (user_id = auth.uid());

-- Messages RLS policies
create policy "Users can view messages in their topics"
  on messages for select
  using (
    exists (
      select 1 from topics
      where topics.id = messages.topic_id
      and topics.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their topics"
  on messages for insert
  with check (
    exists (
      select 1 from topics
      where topics.id = messages.topic_id
      and topics.user_id = auth.uid()
    )
  );

create policy "Users can update their own messages"
  on messages for update
  using (user_id = auth.uid());

create policy "Users can delete messages in their topics"
  on messages for delete
  using (
    exists (
      select 1 from topics
      where topics.id = messages.topic_id
      and topics.user_id = auth.uid()
    )
  ); 