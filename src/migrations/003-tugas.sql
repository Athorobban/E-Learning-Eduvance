create table public.tugas (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null,
  judul text not null,
  deskripsi text,
  deadline timestamptz,
  file_url text, -- file tugas guru (pdf/doc)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint fk_guru_id
    foreign key (guru_id)
    references auth.users (id)
    on delete cascade
);

-- Index untuk mempercepat query per guru
create index tugas_guru_id_idx on public.tugas (guru_id);

create table public.tugas_pengumpulan (
  id uuid primary key default gen_random_uuid(),
  tugas_id uuid not null,
  siswa_id uuid not null,

  jawaban_teks text,
  file_url text, -- file jawaban siswa (pdf/doc/gambar)

  nilai integer,
  catatan_guru text,

  status text not null default 'submitted'
    check (status in ('submitted', 'graded')),

  submitted_at timestamptz default now(),
  graded_at timestamptz,

  constraint fk_tugas_id
    foreign key (tugas_id)
    references public.tugas (id)
    on delete cascade,

  constraint fk_siswa_id
    foreign key (siswa_id)
    references auth.users (id)
    on delete cascade
);

-- Siswa hanya bisa submit 1 kali untuk 1 tugas
create unique index tugas_pengumpulan_unique
  on public.tugas_pengumpulan (tugas_id, siswa_id);

create index tugas_pengumpulan_tugas_id_idx on public.tugas_pengumpulan (tugas_id);
create index tugas_pengumpulan_siswa_id_idx on public.tugas_pengumpulan (siswa_id);