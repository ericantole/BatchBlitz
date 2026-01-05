
-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  is_pro boolean default false,
  subscription_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Create Policies

-- READ: Users can read their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- UPDATE: Users can update their own profile (Needed for PayPal success callback)
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- 4. Create Trigger for New Users
-- This function runs every time a new user signs up via Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_pro)
  values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Backfill for Existing Users (Run this once to fix current users)
insert into public.profiles (id, email, is_pro)
select id, email, false
from auth.users
on conflict (id) do nothing;

-- 6. Payment Audit Log (New)
create table if not exists public.payment_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  event_type text not null,
  provider_payment_id text,
  amount text,
  currency text,
  payload jsonb,
  created_at timestamp with time zone default now()
);

-- Allow Service Role full access
alter table public.payment_events enable row level security;
create policy "Service Role Full Access" on public.payment_events
  using (true)
  with check (true);
