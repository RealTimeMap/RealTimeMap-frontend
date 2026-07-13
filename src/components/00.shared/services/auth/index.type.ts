export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface AuthGoogleResponse {
  authorization_url: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegistrationPayload extends LoginPayload {
  email: string
  is_active?: boolean
  is_superuser?: boolean
  is_verified?: boolean
}
