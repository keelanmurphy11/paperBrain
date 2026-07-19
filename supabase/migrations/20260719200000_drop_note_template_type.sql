-- Remove note template metadata (Fact scaffolds and template picker removed).

alter table public.notes drop constraint if exists notes_template_type_check;
alter table public.notes drop column if exists template_type;
