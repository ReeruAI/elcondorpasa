import { LucideIcon } from "lucide-react";
import { ObjectId } from "mongodb";

export type NewUserType = {
  _id?: ObjectId;
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  telegram: boolean;
  telegramChatId?: number; // Chat ID dari Telegram
  telegramUsername?: string; // Username Telegram (optional)
  reeruToken: number;
};

export type User = {
  emailUsername: string;
  password: string;
};

//! Database Models
export interface UserModel {
  _id?: ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  telegram: boolean;
  reeruToken: number;
}

export interface Package {
  _id?: ObjectId;
  name: string;
  reeruToken: number;
  price: number;
}

export interface Transaction {
  _id?: ObjectId;
  packageId: ObjectId;
  userId: ObjectId;
  status: "pending" | "paid" | "failed" | "expired";
  amount: number;
  order_id?: string;
  created_at: Date;
  updated_at: Date;
}

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

//! Dashboard specific types
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

export interface VideoCardProps {
  video: TrendingVideo;
  onClick: () => void;
  index?: number;
  isVisible?: boolean;
}

export interface UserPreferences {
  contentPreference?: string;
  languagePreference?: string;
}

export interface StreamingProgressProps {
  message: string;
}

export interface LoadingModalProps {
  isOpen: boolean;
}

export interface ScrollDirection {
  direction: "left" | "right";
}
