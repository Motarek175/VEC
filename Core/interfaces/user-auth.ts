export interface login {
  email: string;
  password: string;
}

export interface signUp {
  userName: string;
  email: string;
  password: string;
  phone: string;
  state: string;
  governorate: string;
  location: string;
  gender: string;
  birthDate: string;
}

export interface forget {
  email: string;
}

export interface Rest {
  email: string;
  verificationCode: string;
}

export interface ResetPassword {
  email: string;
  newPassword: string;
}

export interface merchantReg {
  userName: string;
  email: string;
  password: string;
  phone: string;
  state: string;
  governorate: string;
  location: string;
  gender: string;
  nationalId: string;
}

export interface ProfileInfo {
  name: string;
  image: string;
  email: string;
  phone: string;
  governorate: string;
  location: string;
  state: string;
}
