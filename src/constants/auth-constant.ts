export const INITIAL_LOGIN_FORM = {
  email: "",
  password: "",
};

export const INITIAL_STATE_LOGIN_FORM = {
  status: "idle",
  errors: {
    email: [],
    password: [],
    _form: [],
  },
};

export const INITIAL_STATE_PROFILE = {
  id: "",
  name: "",
  role: "",
};

export const INITIAL_CREATE_USER_FORM = {
  name: "",
  role: "",
  email: "",
  password: "",
};

export const INITIAL_STATE_CREATE_USER = {
  status: "idle",
  errors: {
    name: [],
    email: [],
    password: [],
    role: [],
    _form: [],
  },
};

export const INITIAL_STATE_UPDATE_USER = {
  status: "idle",
  errors: {
    name: [],
    role: [],
    _form: [],
  },
};

export const ROLE_LIST = [
  {
    value: "Admin",
    label: "Admin",
  },
  {
    value: "User",
    label: "User",
  },
];
