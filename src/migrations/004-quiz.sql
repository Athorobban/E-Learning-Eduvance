create table if not exists public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quizzes enable row level security;

create table if not exists public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_questions enable row level security;

create table if not exists public.quiz_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_options enable row level security;

create table if not exists public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score integer default 0,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quiz_attempts enable row level security;

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_id uuid not null references public.quiz_options(id) on delete cascade
);

alter table public.quiz_attempt_answers enable row level security;