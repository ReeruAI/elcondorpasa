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

declare module "node-telegram-bot-api" {
  export default class TelegramBot {
    constructor(token: string, options: { polling?: boolean });
    on(event: string, callback: (msg: any) => void): void;
    onText(regex: RegExp, callback: (msg: any) => void): void;
    sendMessage(chatId: number, text: string, options?: any): Promise<any>;
  }
}
