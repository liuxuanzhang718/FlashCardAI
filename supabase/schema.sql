-- Create tables

create table decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references decks on delete cascade not null,
  front text not null,
  back text not null,
  interval integer default 0,
  repetition integer default 0,
  efactor float default 2.5,
  next_review timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table decks enable row level security;
alter table cards enable row level security;

-- Policies
create policy "Users can view their own decks" on decks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own decks" on decks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own decks" on decks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own decks" on decks
  for delete using (auth.uid() = user_id);

create policy "Users can view their own cards" on cards
  for select using (
    exists (
      select 1 from decks
      where decks.id = cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can insert their own cards" on cards
  for insert with check (
    exists (
      select 1 from decks
      where decks.id = cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can update their own cards" on cards
  for update using (
    exists (
      select 1 from decks
      where decks.id = cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can delete their own cards" on cards
  for delete using (
    exists (
      select 1 from decks
      where decks.id = cards.deck_id
      and decks.user_id = auth.uid()
    )
  );
