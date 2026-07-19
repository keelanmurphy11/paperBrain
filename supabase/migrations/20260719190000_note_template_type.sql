-- Optional note template metadata for future filtering.
-- null = blank / freeform (or legacy notes); 'fact' = Fact note scaffold.

alter table public.notes
  add column template_type text
  constraint notes_template_type_check
    check (template_type is null or template_type in ('fact'));

comment on column public.notes.template_type is
  'Optional template used at creation (e.g. fact). Null means blank/freeform.';
