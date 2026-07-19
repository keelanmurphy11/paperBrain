-- Combined ranked search across notes, tags, and sources
-- Call via: supabase.rpc('search_notes', { search_query: 'creatine', result_limit: 25 })

create or replace function public.search_notes(
  search_query text,
  result_limit int default 25
)
returns table (
  note_id uuid,
  title text,
  updated_at timestamptz,
  rank real,
  snippet text,
  matched_via text[],
  sources jsonb,
  tags jsonb
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q text := trim(both from coalesce(search_query, ''));
  tsq tsquery;
  like_pattern text;
  lim int := greatest(1, least(coalesce(result_limit, 25), 50));
begin
  if q = '' then
    return;
  end if;

  begin
    tsq := websearch_to_tsquery('english', q);
  exception
    when others then
      tsq := plainto_tsquery('english', q);
  end;

  like_pattern :=
    '%'
    || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_')
    || '%';

  return query
  with matched as (
    select
      n.id,
      n.title,
      n.content_text,
      n.updated_at,
      (
        case
          when tsq <> ''::tsquery and n.search_vector @@ tsq
            then ts_rank(n.search_vector, tsq)
          else 0::real
        end
        + case
            when n.title ilike like_pattern escape '\' then 0.35
            else 0
          end
        + case
            when exists (
              select 1
              from public.note_tags nt
              join public.tags t on t.id = nt.tag_id
              where nt.note_id = n.id
                and t.name ilike like_pattern escape '\'
            ) then 0.5
            else 0
          end
        + case
            when exists (
              select 1
              from public.sources s
              where s.note_id = n.id
                and (
                  coalesce(s.title, '') ilike like_pattern escape '\'
                  or s.url ilike like_pattern escape '\'
                )
            ) then 0.45
            else 0
          end
      )::real as rank_score,
      case
        when tsq <> ''::tsquery and n.search_vector @@ tsq then
          ts_headline(
            'english',
            coalesce(nullif(btrim(n.content_text), ''), nullif(btrim(n.title), ''), 'Untitled'),
            tsq,
            'StartSel=<mark>, StopSel=</mark>, MaxFragments=1, MaxWords=32, MinWords=10, FragmentDelimiter= … '
          )
        when n.content_text ilike like_pattern escape '\' then
          left(
            regexp_replace(coalesce(n.content_text, ''), '\s+', ' ', 'g'),
            160
          )
        when n.title ilike like_pattern escape '\' then
          coalesce(nullif(btrim(n.title), ''), 'Untitled')
        else
          left(
            regexp_replace(coalesce(n.content_text, ''), '\s+', ' ', 'g'),
            140
          )
      end as snippet_text,
      array_remove(
        array[
          case
            when n.title ilike like_pattern escape '\'
              or (
                tsq <> ''::tsquery
                and to_tsvector('english', coalesce(n.title, '')) @@ tsq
              )
            then 'title'
            else null
          end,
          case
            when (
              tsq <> ''::tsquery
              and n.search_vector @@ tsq
            )
              or n.content_text ilike like_pattern escape '\'
            then 'content'
            else null
          end,
          case
            when exists (
              select 1
              from public.note_tags nt
              join public.tags t on t.id = nt.tag_id
              where nt.note_id = n.id
                and t.name ilike like_pattern escape '\'
            ) then 'tag'
            else null
          end,
          case
            when exists (
              select 1
              from public.sources s
              where s.note_id = n.id
                and (
                  coalesce(s.title, '') ilike like_pattern escape '\'
                  or s.url ilike like_pattern escape '\'
                )
            ) then 'source'
            else null
          end
        ],
        null
      ) as via
    from public.notes n
    where n.user_id = auth.uid()
      and (
        (tsq <> ''::tsquery and n.search_vector @@ tsq)
        or n.title ilike like_pattern escape '\'
        or n.content_text ilike like_pattern escape '\'
        or exists (
          select 1
          from public.note_tags nt
          join public.tags t on t.id = nt.tag_id
          where nt.note_id = n.id
            and t.name ilike like_pattern escape '\'
        )
        or exists (
          select 1
          from public.sources s
          where s.note_id = n.id
            and (
              coalesce(s.title, '') ilike like_pattern escape '\'
              or s.url ilike like_pattern escape '\'
            )
        )
      )
  )
  select
    m.id as note_id,
    m.title,
    m.updated_at,
    m.rank_score as rank,
    m.snippet_text as snippet,
    m.via as matched_via,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'url', s.url,
            'matched',
              (
                coalesce(s.title, '') ilike like_pattern escape '\'
                or s.url ilike like_pattern escape '\'
              )
          )
          order by
            (
              coalesce(s.title, '') ilike like_pattern escape '\'
              or s.url ilike like_pattern escape '\'
            ) desc,
            s.created_at asc
        )
        from public.sources s
        where s.note_id = m.id
      ),
      '[]'::jsonb
    ) as sources,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'matched', (t.name ilike like_pattern escape '\')
          )
          order by
            (t.name ilike like_pattern escape '\') desc,
            t.name asc
        )
        from public.note_tags nt
        join public.tags t on t.id = nt.tag_id
        where nt.note_id = m.id
      ),
      '[]'::jsonb
    ) as tags
  from matched m
  where cardinality(m.via) > 0
  order by m.rank_score desc, m.updated_at desc
  limit lim;
end;
$$;

revoke all on function public.search_notes(text, int) from public;
grant execute on function public.search_notes(text, int) to authenticated;
grant execute on function public.search_notes(text, int) to service_role;

comment on function public.search_notes(text, int) is
  'Ranked search across note title/content (tsvector), tags, and sources for the current user.';
