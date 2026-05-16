alter table public.quotes
  add column if not exists food_drinks_cost_net numeric not null default 0,
  add column if not exists van_rental_cost_net numeric not null default 0,
  add column if not exists transport_cost_net numeric not null default 0,
  add column if not exists staff_cost_net numeric not null default 0,
  add column if not exists consumables_cost_net numeric not null default 0,
  add column if not exists extra_costs_net numeric not null default 0,
  add column if not exists total_cost_net numeric not null default 0,
  add column if not exists margin_percent numeric not null default 30,
  add column if not exists offer_net numeric not null default 0,
  add column if not exists profit_net numeric not null default 0,
  add column if not exists offer_vat_rate numeric not null default 24,
  add column if not exists offer_vat_amount numeric not null default 0,
  add column if not exists offer_gross numeric not null default 0;

alter table public.quote_items
  add column if not exists line_type text not null default 'menu',
  add column if not exists is_extra_expense boolean not null default false;

alter table public.quote_requests
  add column if not exists deleted_at timestamptz null;

update public.quote_products product
set
  name = 'Αναλώσιμα',
  category = 'service',
  product_key = 'consumables-cost',
  audience = 'service',
  unit = 'fixed',
  vat_rate = 24,
  is_active = true,
  sort_order = case when product.sort_order = 0 then 340 else product.sort_order end
where product.product_key = 'consumables-cost'
   or product.name = 'Αναλώσιμα';

insert into public.quote_products (
  name,
  category,
  product_key,
  audience,
  unit,
  price_net,
  vat_rate,
  is_active,
  sort_order
)
select
  'Αναλώσιμα',
  'service',
  'consumables-cost',
  'service',
  'fixed',
  0,
  24,
  true,
  340
where not exists (
  select 1
  from public.quote_products product
  where product.product_key = 'consumables-cost'
     or product.name = 'Αναλώσιμα'
);

with menu_products (name, product_key, sort_order) as (
  values
    ('Κεφτεδάκια', 'keftedakia', 105),
    ('Κοτομπουκιές', 'kotompoukies', 106)
)
update public.quote_products product
set
  name = menu_products.name,
  category = 'food',
  product_key = menu_products.product_key,
  audience = 'both',
  unit = 'per_person',
  vat_rate = 13,
  is_active = true,
  sort_order = case when product.sort_order = 0 then menu_products.sort_order else product.sort_order end
from menu_products
where product.product_key = menu_products.product_key
   or product.name = menu_products.name;

with menu_products (name, product_key, sort_order) as (
  values
    ('Κεφτεδάκια', 'keftedakia', 105),
    ('Κοτομπουκιές', 'kotompoukies', 106)
)
insert into public.quote_products (
  name,
  category,
  product_key,
  audience,
  unit,
  price_net,
  vat_rate,
  is_active,
  sort_order
)
select
  menu_products.name,
  'food',
  menu_products.product_key,
  'both',
  'per_person',
  0,
  13,
  true,
  menu_products.sort_order
from menu_products
where not exists (
  select 1
  from public.quote_products product
  where product.product_key = menu_products.product_key
     or product.name = menu_products.name
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quotes'::regclass
      and conname = 'quotes_margin_percent_check'
  ) then
    alter table public.quotes
      add constraint quotes_margin_percent_check
      check (margin_percent >= 0 and margin_percent < 100)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quotes'::regclass
      and conname = 'quotes_offer_vat_rate_non_negative_check'
  ) then
    alter table public.quotes
      add constraint quotes_offer_vat_rate_non_negative_check
      check (offer_vat_rate >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_items'::regclass
      and conname = 'quote_items_line_type_check'
  ) then
    alter table public.quote_items
      add constraint quote_items_line_type_check
      check (line_type in ('menu', 'service', 'extra'))
      not valid;
  end if;
end;
$$;

alter table public.quotes validate constraint quotes_margin_percent_check;
alter table public.quotes validate constraint quotes_offer_vat_rate_non_negative_check;
alter table public.quote_items validate constraint quote_items_line_type_check;

create index if not exists quote_requests_deleted_at_idx
  on public.quote_requests (deleted_at);

create index if not exists quote_items_line_type_idx
  on public.quote_items (line_type);
