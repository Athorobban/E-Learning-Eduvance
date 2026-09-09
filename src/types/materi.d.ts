export type MateriFormState = {
  status?: string;
  errors?: {
    id?: string[];
    judul?: string[];
    deskripsi?: string[];
    kategori?: string[];
    kelas?: string[];
    pertemuan?: string[];
    file_url?: string[];
    thumbnail_url?: string[];
    video_url?: string[];
    _form?: string[];
  };
};
