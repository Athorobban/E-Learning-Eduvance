export type TugasFormState = {
  status?: string;
  errors?: {
    judul?: string[];
    deskripsi?: string[];
    deadline?: string[];
    file_url?: string[];
    _form?: string[];
  };
};
