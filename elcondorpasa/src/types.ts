import { LucideIcon } from "lucide-react";

import { ObjectId } from "mongodb";

export type NewUserType = {
  _id?: ObjectId; // Updated _id to use ObjectId type from MongoDB
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  telegram: boolean;
  reeruToken: number;
};

export type User = {
  emailUsername: string;
  password: string;
};

//! Landing Page Types
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

//! Register Types
export interface AuthResponse {
  message?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface FormField {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  label: string;
  icon: LucideIcon;
}

//! Dashboard Types
export interface TrendingVideo {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  url: string;
  views: string;
  duration: string;
  channel: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: TrendingVideo | null;
  onGenerateClip: (url: string) => void;
}
