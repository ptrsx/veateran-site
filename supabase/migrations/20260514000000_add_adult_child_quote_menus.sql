alter table public.quote_requests
  add column if not exists adult_guest_count integer null,
  add column if not exists child_guest_count integer null,
  add column if not exists selected_adult_menu_items jsonb not null default '[]'::jsonb,
  add column if not exists selected_child_menu_items jsonb not null default '[]'::jsonb;

alter table public.quote_requests
  alter column selected_adult_menu_items set default '[]'::jsonb,
  alter column selected_child_menu_items set default '[]'::jsonb;

alter table public.quote_requests
  alter column child_guest_count set default 0;

update public.quote_requests
set adult_guest_count = guest_count
where adult_guest_count is null
  and guest_count is not null;

update public.quote_requests
set child_guest_count = 0
where child_guest_count is null;

update public.quote_requests
set selected_adult_menu_items = selected_menu_items
where jsonb_typeof(selected_menu_items) = 'array'
  and jsonb_array_length(selected_menu_items) > 0
  and (
    selected_adult_menu_items is null
    or jsonb_typeof(selected_adult_menu_items) <> 'array'
    or jsonb_array_length(selected_adult_menu_items) = 0
  );

update public.quote_requests
set selected_adult_menu_items = '[]'::jsonb
where selected_adult_menu_items is null
  or jsonb_typeof(selected_adult_menu_items) <> 'array';

update public.quote_requests
set selected_child_menu_items = '[]'::jsonb
where selected_child_menu_items is null
  or jsonb_typeof(selected_child_menu_items) <> 'array';

alter table public.quote_requests
  alter column selected_adult_menu_items set not null,
  alter column selected_child_menu_items set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_adult_guest_count_non_negative_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_adult_guest_count_non_negative_check
      check (adult_guest_count is null or adult_guest_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_child_guest_count_non_negative_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_child_guest_count_non_negative_check
      check (child_guest_count is null or child_guest_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_guest_breakdown_present_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_guest_breakdown_present_check
      check (
        adult_guest_count is null
        or child_guest_count is null
        or adult_guest_count > 0
        or child_guest_count > 0
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_selected_adult_menu_items_array_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_selected_adult_menu_items_array_check
      check (jsonb_typeof(selected_adult_menu_items) = 'array')
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_selected_child_menu_items_array_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_selected_child_menu_items_array_check
      check (jsonb_typeof(selected_child_menu_items) = 'array')
      not valid;
  end if;
end;
$$;

alter table public.quote_requests
  validate constraint quote_requests_adult_guest_count_non_negative_check;

alter table public.quote_requests
  validate constraint quote_requests_child_guest_count_non_negative_check;

alter table public.quote_requests
  validate constraint quote_requests_selected_adult_menu_items_array_check;

alter table public.quote_requests
  validate constraint quote_requests_selected_child_menu_items_array_check;

create index if not exists quote_requests_adult_guest_count_idx
  on public.quote_requests (adult_guest_count);

create index if not exists quote_requests_child_guest_count_idx
  on public.quote_requests (child_guest_count);

create index if not exists quote_requests_selected_adult_menu_items_gin_idx
  on public.quote_requests using gin (selected_adult_menu_items);

create index if not exists quote_requests_selected_child_menu_items_gin_idx
  on public.quote_requests using gin (selected_child_menu_items);

alter table public.quote_products
  add column if not exists audience text not null default 'adult';

alter table public.quote_products
  alter column audience set default 'adult';

update public.quote_products
set audience = case
  when name in ('Μπύρες', 'Ποτά', 'Cocktails') then 'adult'
  when category = 'service' then 'service'
  when category in ('food', 'drinks') then 'both'
  else 'adult'
end
where category in ('food', 'drinks', 'service')
  or audience is null
  or audience not in ('adult', 'child', 'both', 'service');

alter table public.quote_products
  alter column audience set not null;

update public.quote_products
set
  name = 'Mocktails',
  category = 'drinks',
  product_key = 'mocktails',
  audience = 'child',
  unit = 'per_person',
  vat_rate = 24,
  is_active = true
where product_key = 'mocktails'
  or lower(name) = 'mocktails';

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
  'Mocktails',
  'drinks',
  'mocktails',
  'child',
  'per_person',
  0,
  24,
  true,
  270
where not exists (
  select 1
  from public.quote_products
  where product_key = 'mocktails'
     or lower(name) = 'mocktails'
);

with service_products (name, product_key, sort_order) as (
  values
    ('Κόστος ενοικίασης van', 'van-rental-cost', 310),
    ('Κόστος μεταφοράς', 'transport-cost', 320),
    ('Κόστος προσωπικού', 'staff-cost', 330)
)
update public.quote_products product
set
  name = service_products.name,
  category = 'service',
  product_key = service_products.product_key,
  audience = 'service',
  unit = 'fixed',
  vat_rate = 24,
  is_active = true,
  sort_order = case
    when product.sort_order = 0 then service_products.sort_order
    else product.sort_order
  end
from service_products
where product.product_key = service_products.product_key
  or product.name = service_products.name;

with service_products (name, product_key, sort_order) as (
  values
    ('Κόστος ενοικίασης van', 'van-rental-cost', 310),
    ('Κόστος μεταφοράς', 'transport-cost', 320),
    ('Κόστος προσωπικού', 'staff-cost', 330)
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
  service_products.name,
  'service',
  service_products.product_key,
  'service',
  'fixed',
  0,
  24,
  true,
  service_products.sort_order
from service_products
where not exists (
  select 1
  from public.quote_products product
  where product.product_key = service_products.product_key
     or product.name = service_products.name
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_products'::regclass
      and conname = 'quote_products_audience_check'
  ) then
    alter table public.quote_products
      add constraint quote_products_audience_check
      check (audience in ('adult', 'child', 'both', 'service'))
      not valid;
  end if;
end;
$$;

alter table public.quote_products
  validate constraint quote_products_audience_check;

create index if not exists quote_products_audience_idx
  on public.quote_products (audience);

create index if not exists quote_products_category_audience_idx
  on public.quote_products (category, audience);

alter table public.quotes
  add column if not exists adult_guest_count integer null,
  add column if not exists child_guest_count integer null;

update public.quotes quote
set
  adult_guest_count = coalesce(request.adult_guest_count, quote.guest_count),
  child_guest_count = coalesce(request.child_guest_count, 0)
from public.quote_requests request
where quote.request_id = request.id
  and (quote.adult_guest_count is null or quote.child_guest_count is null);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quotes'::regclass
      and conname = 'quotes_adult_guest_count_non_negative_check'
  ) then
    alter table public.quotes
      add constraint quotes_adult_guest_count_non_negative_check
      check (adult_guest_count is null or adult_guest_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quotes'::regclass
      and conname = 'quotes_child_guest_count_non_negative_check'
  ) then
    alter table public.quotes
      add constraint quotes_child_guest_count_non_negative_check
      check (child_guest_count is null or child_guest_count >= 0)
      not valid;
  end if;
end;
$$;

alter table public.quotes
  validate constraint quotes_adult_guest_count_non_negative_check;

alter table public.quotes
  validate constraint quotes_child_guest_count_non_negative_check;

create index if not exists quotes_adult_guest_count_idx
  on public.quotes (adult_guest_count);

create index if not exists quotes_child_guest_count_idx
  on public.quotes (child_guest_count);

alter table public.quote_items
  add column if not exists audience text null;

update public.quote_items
set audience = 'service'
where audience is null
  and category = 'service';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_items'::regclass
      and conname = 'quote_items_audience_check'
  ) then
    alter table public.quote_items
      add constraint quote_items_audience_check
      check (audience is null or audience in ('adult', 'child', 'service'))
      not valid;
  end if;
end;
$$;

alter table public.quote_items
  validate constraint quote_items_audience_check;

create index if not exists quote_items_audience_idx
  on public.quote_items (audience);
