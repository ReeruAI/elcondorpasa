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
