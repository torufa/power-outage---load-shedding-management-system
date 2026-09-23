export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role?: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  phone?: string;
  areaId?: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IVerifyOtp {
  email: string;
  otp: string;
}

export interface IGoogleLogin {
  idToken?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  googleId: string;
}
