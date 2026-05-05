create table if not exists public.quote_products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  category text not null,
  unit text not null default 'per_person',
  price_net numeric not null default 0,
  vat_rate numeric not null default 24,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  notes text null,

  constraint quote_products_category_check check (
    category in ('food', 'drinks', 'service', 'other')
  ),
  constraint quote_products_unit_check check (
    unit in ('per_person', 'per_item', 'fixed')
  ),
  constraint quote_products_price_net_non_negative_check check (price_net >= 0),
  constraint quote_products_vat_rate_non_negative_check check (vat_rate >= 0)
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

drop trigger if exists set_quote_products_updated_at on public.quote_products;

create trigger set_quote_products_updated_at
before update on public.quote_products
for each row
execute function public.set_updated_at();

alter table public.quote_products enable row level security;

create index if not exists quote_products_category_idx on public.quote_products (category);
create index if not exists quote_products_is_active_idx on public.quote_products (is_active);
create index if not exists quote_products_sort_order_idx on public.quote_products (sort_order);

with seed_products (name, category, sort_order) as (
  values
    ('Mini burger', 'food', 10),
    ('Chicken caesar wrap roll', 'food', 20),
    ('Hot dog', 'food', 30),
    ('Φωλιά', 'food', 40),
    ('The VeatERAN stick', 'food', 50),
    ('Φλογέρες', 'food', 60),
    ('Τυροκροκέτες', 'food', 70),
    ('Μακαρονοσαλάτα', 'food', 80),
    ('Spring rolls', 'food', 90),
    ('Καλαμάκια', 'food', 100),
    ('Πίτα club κοτόπουλο', 'food', 110),
    ('Μπόμπα', 'food', 120),
    ('Bao bun', 'food', 130),
    ('Νερά', 'drinks', 210),
    ('Αναψυκτικά', 'drinks', 220),
    ('Χυμοί', 'drinks', 230),
    ('Μπύρες', 'drinks', 240),
    ('Ποτά', 'drinks', 250),
    ('Cocktails', 'drinks', 260)
)
insert into public.quote_products (
  name,
  category,
  unit,
  price_net,
  vat_rate,
  is_active,
  sort_order
)
select
  seed_products.name,
  seed_products.category,
  'per_person',
  0,
  24,
  true,
  seed_products.sort_order
from seed_products
where not exists (
  select 1
  from public.quote_products existing
  where existing.name = seed_products.name
    and existing.category = seed_products.category
);
