import { LucideIcon } from "lucide-react";
import { ObjectId } from "mongodb";

//! Telegram Integration Types
export interface TelegramOTP {
  code: string;
  generatedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

export interface PendingTelegramVerification {
  email: string;
  chatId: number;
  telegramName: string;
  telegramUsername?: string;
  initiatedAt: Date;
  expiresAt: Date;
}

//! User Types
export type NewUserType = {
  _id?: ObjectId;
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  telegram: boolean;
  telegramChatId?: number;
  telegramUsername?: string;
  telegramOTP?: TelegramOTP;
  pendingTelegramVerification?: PendingTelegramVerification;
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
  telegramChatId?: number;
  telegramUsername?: string;
  telegramOTP?: TelegramOTP;
  pendingTelegramVerification?: PendingTelegramVerification;
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

//! Authentication Types
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

//! Klap API Types
export interface KlapStreamData {
  status: string;
  message: string;
  progress: number;
  task_id?: string;
  project_id?: string;
  short?: {
    id: string;
    title: string;
    virality_score: number;
    transcript: string;
    description: string;
    captions: {
      tiktok: string;
      youtube: string;
      linkedin: string;
      instagram: string;
    };
    export_status: string;
    download_url: string;
    export_id: string;
  };
}

export interface ProcessingState {
  isProcessing: boolean;
  taskId?: string;
  projectId?: string;
  progress: number;
  message: string;
  status: string;
}

export interface VideoResult {
  title: string;
  virality_score: number;
  captions: {
    tiktok: string;
    youtube: string;
    linkedin: string;
    instagram: string;
  };
  download_url: string;
}

//! YouTube Integration Types
export interface YouTubeData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  channelName: string;
  email: string;
  connected: boolean;
  connectedAt: Date;
  uploads?: YouTubeUpload[];
}

export interface YouTubeUpload {
  videoId: string;
  title: string;
  uploadedAt: Date;
}

//! Telegram API Response Types
export interface TelegramApiResponse {
  success: boolean;
  message: string;
  user?: {
    name: string;
    email: string;
    telegramUsername?: string;
  };
  errorCode?: string;
}

export interface OTPStatusData {
  isConnected: boolean;
  telegramUsername?: string;
  hasActiveOTP: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
}
