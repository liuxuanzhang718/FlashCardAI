-- Create pdfs table
create table pdfs (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references decks on delete cascade not null,
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add source_pdf_id to cards
alter table cards
add column source_pdf_id uuid references pdfs on delete cascade;

-- Enable RLS
alter table pdfs enable row level security;

-- Policies for pdfs
create policy "Users can view their own pdfs" on pdfs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own pdfs" on pdfs
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own pdfs" on pdfs
  for delete using (auth.uid() = user_id);
