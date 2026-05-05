alter table public.quote_products
  add column if not exists product_key text null;

update public.quote_products
set product_key = case
  when name = 'Mini burger' and category = 'food' then 'mini-burger'
  when name = 'Chicken caesar wrap roll' and category = 'food' then 'chicken-caesar-wrap-roll'
  when name = 'Hot dog' and category = 'food' then 'hot-dog'
  when name = 'Φωλιά' and category = 'food' then 'folia'
  when name = 'The VeatERAN stick' and category = 'food' then 'the-veateran-stick'
  when name = 'Φλογέρες' and category = 'food' then 'flogeres'
  when name = 'Τυροκροκέτες' and category = 'food' then 'tyrokroketes'
  when name = 'Μακαρονοσαλάτα' and category = 'food' then 'makaronosalata'
  when name = 'Spring rolls' and category = 'food' then 'spring-rolls'
  when name = 'Καλαμάκια' and category = 'food' then 'kalamakia'
  when name = 'Πίτα club κοτόπουλο' and category = 'food' then 'pita-club-kotopoulo'
  when name = 'Μπόμπα' and category = 'food' then 'mpompa'
  when name = 'Bao bun' and category = 'food' then 'bao-bun'
  when name = 'Νερά' and category = 'drinks' then 'nera'
  when name = 'Αναψυκτικά' and category = 'drinks' then 'anapsyktika'
  when name = 'Χυμοί' and category = 'drinks' then 'chymoi'
  when name = 'Μπύρες' and category = 'drinks' then 'mpyres'
  when name = 'Ποτά' and category = 'drinks' then 'pota'
  when name = 'Cocktails' and category = 'drinks' then 'cocktails'
  else product_key
end
where product_key is null;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  request_id uuid not null references public.quote_requests(id) on delete cascade,
  quote_number text not null unique,
  status text not null default 'DRAFT',
  currency text not null default 'EUR',
  valid_until date null,
  customer_type text not null default 'individual',
  customer_name text not null,
  customer_email text null,
  customer_phone text null,
  business_name text null,
  business_vat text null,
  business_tax_office text null,
  business_address text null,
  contact_name text null,
  contact_email text null,
  contact_phone text null,
  event_type text null,
  event_date date null,
  event_location text null,
  guest_count integer null,
  subtotal_net numeric not null default 0,
  vat_amount numeric not null default 0,
  total_gross numeric not null default 0,
  public_notes text null,
  terms text null,
  internal_notes text null,
  generated_pdf_at timestamptz null,
  sent_at timestamptz null,

  constraint quotes_status_check check (
    status in ('DRAFT', 'READY', 'SENT', 'ACCEPTED', 'DECLINED', 'CANCELLED')
  ),
  constraint quotes_customer_type_check check (
    customer_type in ('individual', 'business')
  ),
  constraint quotes_totals_non_negative_check check (
    subtotal_net >= 0 and vat_amount >= 0 and total_gross >= 0
  )
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid null references public.quote_products(id) on delete set null,
  product_name text not null,
  category text not null,
  unit text not null default 'per_person',
  quantity numeric not null default 1,
  unit_price_net numeric not null default 0,
  vat_rate numeric not null default 24,
  line_total_net numeric not null default 0,
  sort_order integer not null default 0,
  notes text null,

  constraint quote_items_category_check check (
    category in ('food', 'drinks', 'service', 'other')
  ),
  constraint quote_items_unit_check check (
    unit in ('per_person', 'per_item', 'fixed')
  ),
  constraint quote_items_amounts_non_negative_check check (
    quantity >= 0 and unit_price_net >= 0 and vat_rate >= 0 and line_total_net >= 0
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

drop trigger if exists set_quotes_updated_at on public.quotes;

create trigger set_quotes_updated_at
before update on public.quotes
for each row
execute function public.set_updated_at();

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create index if not exists quote_products_product_key_idx on public.quote_products (product_key);
create index if not exists quotes_request_id_idx on public.quotes (request_id);
create index if not exists quotes_status_idx on public.quotes (status);
create index if not exists quotes_quote_number_idx on public.quotes (quote_number);
create index if not exists quotes_created_at_idx on public.quotes (created_at);
create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);
create index if not exists quote_items_product_id_idx on public.quote_items (product_id);
create index if not exists quote_items_category_idx on public.quote_items (category);
