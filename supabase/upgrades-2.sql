-- =========================================================
-- Barberly — upgrades migration #2
-- Run in the Supabase SQL editor after supabase/upgrades.sql.
-- Safe to re-run.
--
-- Adds average rating + review count to the nearby_shops() function so
-- "Shops near me" results can show a star rating like the homepage list.
--
-- Postgres won't let CREATE OR REPLACE change a function's return columns
-- (the row type is defined by its OUT parameters), so the old signature
-- has to be dropped first.
-- =========================================================

drop function if exists public.nearby_shops(double precision, double precision, double precision, text);

create or replace function public.nearby_shops(
  lat double precision,
  lng double precision,
  radius_km double precision default 15,
  search_q text default null
)
returns table (
  id uuid,
  name text,
  city text,
  area text,
  cover_image_url text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  avg_rating double precision,
  review_count bigint
)
language sql
stable
as $$
  with shop_distances as (
    select
      s.id, s.name, s.city, s.area, s.cover_image_url, s.latitude, s.longitude,
      (
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(lat)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians(lng)) +
            sin(radians(lat)) * sin(radians(s.latitude))
          ))
        )
      ) as distance_km
    from public.shops s
    where s.is_published = true
      and s.latitude is not null
      and s.longitude is not null
      and (search_q is null or s.name ilike '%' || search_q || '%')
  )
  select
    sd.id, sd.name, sd.city, sd.area, sd.cover_image_url, sd.latitude, sd.longitude, sd.distance_km,
    r.avg_rating,
    coalesce(r.review_count, 0) as review_count
  from shop_distances sd
  left join (
    select shop_id, avg(rating) as avg_rating, count(*) as review_count
    from public.reviews
    group by shop_id
  ) r on r.shop_id = sd.id
  where sd.distance_km <= radius_km
  order by sd.distance_km asc;
$$;