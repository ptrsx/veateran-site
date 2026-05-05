alter table public.quote_requests
  add column if not exists customer_type text,
  add column if not exists business_name text null,
  add column if not exists business_vat text null,
  add column if not exists business_tax_office text null,
  add column if not exists business_address text null,
  add column if not exists contact_name text null,
  add column if not exists contact_phone text null,
  add column if not exists contact_email text null,
  add column if not exists invoice_required boolean,
  add column if not exists selected_menu_items jsonb;

alter table public.quote_requests
  alter column customer_type set default 'individual',
  alter column invoice_required set default false,
  alter column selected_menu_items set default '[]'::jsonb;

update public.quote_requests
set customer_type = 'individual'
where customer_type is null
  or customer_type not in ('individual', 'business');

update public.quote_requests
set invoice_required = false
where invoice_required is null;

update public.quote_requests
set selected_menu_items = '[]'::jsonb
where selected_menu_items is null
  or jsonb_typeof(selected_menu_items) <> 'array';

alter table public.quote_requests
  alter column customer_type set not null,
  alter column invoice_required set not null,
  alter column selected_menu_items set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_customer_type_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_customer_type_check
      check (customer_type in ('individual', 'business'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_selected_menu_items_array_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_selected_menu_items_array_check
      check (jsonb_typeof(selected_menu_items) = 'array')
      not valid;
  end if;
end;
$$;

alter table public.quote_requests
  validate constraint quote_requests_customer_type_check;

alter table public.quote_requests
  validate constraint quote_requests_selected_menu_items_array_check;

create index if not exists quote_requests_customer_type_idx on public.quote_requests (customer_type);
create index if not exists quote_requests_business_name_idx on public.quote_requests (business_name);
create index if not exists quote_requests_business_vat_idx on public.quote_requests (business_vat);
create index if not exists quote_requests_selected_menu_items_gin_idx
  on public.quote_requests using gin (selected_menu_items);
