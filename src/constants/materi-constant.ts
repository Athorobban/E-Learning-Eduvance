export const HEADER_TABLE_MATERI = ["No", "Judul", "Kategori", "Kelas & Pertemuan", "File / Video", "Action"];

export const CATEGORY_MATERI_LIST = [
  { label: "Matematika", value: "Matematika" },
  { label: "Bahasa Indonesia", value: "Bahasa Indonesia" },
  { label: "IPA", value: "IPA" },
  { label: "IPS", value: "IPS" },
  { label: "PPKn", value: "PPKn" },
  { label: "SBdP", value: "SBdP" },
];

export const KELAS_LIST = [
  { label: "Kelas 1", value: "1" },
  { label: "Kelas 2", value: "2" },
  { label: "Kelas 3", value: "3" },
  { label: "Kelas 4", value: "4" },
  { label: "Kelas 5", value: "5" },
  { label: "Kelas 6", value: "6" },
];

export const INITIAL_MATERI = {
  judul: "",
  deskripsi: "",
  kategori: "",
  kelas: "",
  pertemuan: undefined,
  file_url: undefined,
  thumbnail_url: undefined,
  video_url: "",
};

export const INITIAL_STATE_MATERI = {
  status: "idle",
  errors: {
    id: [],
    judul: [],
    deskripsi: [],
    kategori: [],
    kelas: [],
    pertemuan: [],
    file_url: [],
    thumbnail_url: [],
    video_url: [],
    _form: [],
  },
};
