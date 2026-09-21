export class RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  tutorTitle?: string;
}

export class LoginDto {
  email: string;
  password: string;
}
