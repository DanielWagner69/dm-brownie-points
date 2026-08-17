-- Wishlist product link + optional preview image (og:image)
alter table rewards add column if not exists link_url text;
alter table rewards add column if not exists image_url text;
