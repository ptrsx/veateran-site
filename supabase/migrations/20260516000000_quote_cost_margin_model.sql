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

update public.quote_items
set
  line_type = case
    when audience in ('adult', 'child') then 'menu'
    when audience = 'service' or category = 'service' then 'service'
    else 'menu'
  end,
  is_extra_expense = false
where line_type is null
   or line_type not in ('menu', 'service', 'extra')
   or line_type = 'menu';

update public.quote_items
set line_type = 'extra'
where is_extra_expense = true;

update public.quote_products product
set
  name = 'Αναλώσιμα',
  category = 'service',
  product_key = 'consumables-cost',
  audience = 'service',
  unit = 'fixed',
  vat_rate = 24,
  is_active = true,
  sort_order = case
    when product.sort_order = 0 then 340
    else product.sort_order
  end
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

do $$
begin
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

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_items'::regclass
      and conname = 'quote_items_cost_amounts_non_negative_check'
  ) then
    alter table public.quote_items
      add constraint quote_items_cost_amounts_non_negative_check
      check (quantity >= 0 and unit_price_net >= 0 and vat_rate >= 0 and line_total_net >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quotes'::regclass
      and conname = 'quotes_cost_amounts_non_negative_check'
  ) then
    alter table public.quotes
      add constraint quotes_cost_amounts_non_negative_check
      check (
        food_drinks_cost_net >= 0
        and van_rental_cost_net >= 0
        and transport_cost_net >= 0
        and staff_cost_net >= 0
        and consumables_cost_net >= 0
        and extra_costs_net >= 0
        and total_cost_net >= 0
        and offer_net >= 0
        and profit_net >= 0
        and offer_vat_amount >= 0
        and offer_gross >= 0
        and subtotal_net >= 0
        and vat_amount >= 0
        and total_gross >= 0
      )
      not valid;
  end if;

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
end;
$$;

alter table public.quote_items validate constraint quote_items_line_type_check;
alter table public.quote_items validate constraint quote_items_cost_amounts_non_negative_check;
alter table public.quotes validate constraint quotes_cost_amounts_non_negative_check;
alter table public.quotes validate constraint quotes_margin_percent_check;
alter table public.quotes validate constraint quotes_offer_vat_rate_non_negative_check;

with item_totals as (
  select
    quote_id,
    coalesce(sum(case when line_type = 'menu' then line_total_net else 0 end), 0) as food_drinks_cost_net,
    coalesce(sum(case when line_type = 'service' and product_name ilike '%van%' then line_total_net else 0 end), 0) as van_rental_cost_net,
    coalesce(sum(case when line_type = 'service' and (product_name ilike '%μεταφορ%' or product_name ilike '%transport%') then line_total_net else 0 end), 0) as transport_cost_net,
    coalesce(sum(case when line_type = 'service' and (product_name ilike '%προσωπ%' or product_name ilike '%staff%') then line_total_net else 0 end), 0) as staff_cost_net,
    coalesce(sum(case when line_type = 'service' and (product_name ilike '%αναλ%' or product_name ilike '%consumable%') then line_total_net else 0 end), 0) as consumables_cost_net,
    coalesce(sum(case when line_type = 'extra' or is_extra_expense = true then line_total_net else 0 end), 0) as extra_costs_net,
    coalesce(sum(line_total_net), 0) as total_cost_net
  from public.quote_items
  group by quote_id
),
calculated_quotes as (
  select
    quote_id,
    food_drinks_cost_net,
    van_rental_cost_net,
    transport_cost_net,
    staff_cost_net,
    consumables_cost_net,
    extra_costs_net,
    total_cost_net,
    round(
      case
        when total_cost_net = 0 then 0
        when 30 = 0 then total_cost_net
        else total_cost_net / (1 - 30::numeric / 100)
      end,
      2
    ) as offer_net
  from item_totals
)
update public.quotes quote
set
  food_drinks_cost_net = calculated.food_drinks_cost_net,
  van_rental_cost_net = calculated.van_rental_cost_net,
  transport_cost_net = calculated.transport_cost_net,
  staff_cost_net = calculated.staff_cost_net,
  consumables_cost_net = calculated.consumables_cost_net,
  extra_costs_net = calculated.extra_costs_net,
  total_cost_net = calculated.total_cost_net,
  margin_percent = 30,
  offer_net = calculated.offer_net,
  profit_net = round(calculated.offer_net - calculated.total_cost_net, 2),
  offer_vat_rate = 24,
  offer_vat_amount = round(calculated.offer_net * 24 / 100, 2),
  offer_gross = round(calculated.offer_net + calculated.offer_net * 24 / 100, 2),
  subtotal_net = calculated.offer_net,
  vat_amount = round(calculated.offer_net * 24 / 100, 2),
  total_gross = round(calculated.offer_net + calculated.offer_net * 24 / 100, 2)
from calculated_quotes calculated
where quote.id = calculated.quote_id
  and quote.total_cost_net = 0;

create index if not exists quote_items_line_type_idx
  on public.quote_items (line_type);

create index if not exists quote_items_is_extra_expense_idx
  on public.quote_items (is_extra_expense);
