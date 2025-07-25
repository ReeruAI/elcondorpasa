export type NewUserType = {
  username: string;
  name: string;
  email: string;
  password: string;
  googleId?: string;
  profilePicture?: string;
  isGoogleUser?: boolean;
};

export type User = {
  emailUsername: string;
  password: string;
};

// Landing Page Types
export interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

export interface PricingTier {
  name: string;
  tokens: number;
  desc: string;
  popular: boolean;
}

export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export interface Stat {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

//! Login and Signup Types
export interface GoogleResponse {
  credential: string;
}

export interface LoginResponse {
  message?: string;
  user?: {
    name?: string;
    email?: string;
  };
}
