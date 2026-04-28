create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'NEW',

  name text not null,
  phone text not null,
  email text not null,

  event_type text not null,
  event_date date null,
  location text null,
  guest_count integer null,
  interested_in text null,
  notes text null,

  internal_notes text null,
  price_per_person numeric null,
  quoted_total numeric null,
  final_guest_count integer null,
  final_total numeric null,
  deposit_amount numeric null,
  source text not null default 'website',
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  quote_sent_at timestamptz null,
  last_contacted_at timestamptz null,
  next_follow_up_at timestamptz null,
  closed_at timestamptz null,
  lost_reason text null,

  constraint quote_requests_status_check check (
    status in (
      'NEW',
      'CONTACTED',
      'NEEDS_QUOTE',
      'QUOTE_SENT',
      'WAITING_REPLY',
      'WON',
      'LOST',
      'CANCELLED'
    )
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_quote_requests_updated_at on public.quote_requests;

create trigger set_quote_requests_updated_at
before update on public.quote_requests
for each row
execute function public.set_updated_at();

create index if not exists quote_requests_status_idx on public.quote_requests (status);
create index if not exists quote_requests_event_type_idx on public.quote_requests (event_type);
create index if not exists quote_requests_event_date_idx on public.quote_requests (event_date);
create index if not exists quote_requests_created_at_idx on public.quote_requests (created_at);
create index if not exists quote_requests_guest_count_idx on public.quote_requests (guest_count);
create index if not exists quote_requests_email_idx on public.quote_requests (email);
create index if not exists quote_requests_phone_idx on public.quote_requests (phone);
