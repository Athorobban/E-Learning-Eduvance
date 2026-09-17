export type AuthFormState = {
  status?: string;
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
    role?: string[];
    _form?: string[];
  };
};

export type Profile = {
  id?: string;
  name?: string;
  role?: string;
};
