create table public.materi (
  id uuid not null default gen_random_uuid(),

  -- informasi materi
  judul text not null,
  deskripsi text,
  kelas text,                      
  pertemuan integer,               
  kategori text,                   
  file_url text,                   
  video_url text,                  
  thumbnail_url text,              

  -- relasi user (guru)
  guru_id uuid references auth.users(id) on delete set null,

  -- timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (id)
);

alter table public.materi enable row level security;