-- Add ON DELETE CASCADE to decks table
alter table decks
drop constraint if exists decks_user_id_fkey,
add constraint decks_user_id_fkey
   foreign key (user_id)
   references auth.users(id)
   on delete cascade;

-- Add ON DELETE CASCADE to pdfs table
alter table pdfs
drop constraint if exists pdfs_user_id_fkey,
add constraint pdfs_user_id_fkey
   foreign key (user_id)
   references auth.users(id)
   on delete cascade;
