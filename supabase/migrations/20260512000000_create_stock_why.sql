create table if not exists stock_why (
  symbol      text        primary key,
  tag         text        not null,
  title       text        not null,
  summary     text        not null,
  bullets     text[]      not null,
  updated_at  timestamptz not null default now()
);
