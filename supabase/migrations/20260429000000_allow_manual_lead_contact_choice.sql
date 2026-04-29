alter table public.quote_requests
  alter column phone drop not null,
  alter column email drop not null;

alter table public.quote_requests
  drop constraint if exists quote_requests_contact_check;

alter table public.quote_requests
  add constraint quote_requests_contact_check
  check (
    (phone is not null and length(trim(phone)) > 0)
    or
    (email is not null and length(trim(email)) > 0)
  )
  not valid;

alter table public.quote_requests
  validate constraint quote_requests_contact_check;
