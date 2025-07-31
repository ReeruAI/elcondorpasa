import { LucideIcon } from "lucide-react";
import { ObjectId } from "mongodb";

//! Telegram Integration Types
export interface TelegramUserState {
  step: "waiting_email" | "waiting_otp";
  email?: string;
  expiresAt?: Date;
}

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
  price: number;
  desc: string;
  features: string[];
  popular: boolean;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
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
  description: string;
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

//! Types for your-clip
export interface VideoShort {
  title: string;
  download_url: string;
  created_at: string;
  virality_score?: number;
  description?: string;
  captions?: {
    tiktok: string;
    youtube: string;
    linkedin: string;
    instagram: string;
  };
}

export interface UserShortsResponse {
  _id: string;
  userid: string;
  createdAt: string;
  shorts: VideoShort[];
  updatedAt: string;
}

export interface PlatformConfig {
  icon: string;
  color: string;
}

export type PlatformType = "tiktok" | "youtube" | "linkedin" | "instagram";

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

//! Gemini API Response Types
export interface CachedVideo {
  title: string;
  creator: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  duration: string;
  reasoning: string;
  videoId: string;
}

export interface VideoStreamChunk {
  type: "video";
  data: CachedVideo;
}

export interface ProgressStreamChunk {
  type: "progress";
  progressType: string;
  message: string;
}

export interface VideoResponse {
  type: "video";
  data: CachedVideo;
  index: number;
  totalCount: number;
}

export interface CompletionResponse {
  type: "complete";
  data: {
    videos: CachedVideo[];
  };
  userId: string;
  source: string;
  timestamp: string;
  contentPreference: string;
  languagePreference: string;
  isExhaustedRefresh: boolean;
}

export interface ErrorResponse {
  type: "error";
  error: string;
  message: string;
}

export type StreamChunk = VideoStreamChunk | ProgressStreamChunk | string;

//! YouTube API Response Types
export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId?: string;
  liveBroadcastContent?: string;
  localized?: {
    title: string;
    description: string;
  };
}

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YouTubeSnippet;
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface YouTubeContentDetails {
  duration: string;
  dimension: string;
  definition: string;
  caption: string;
  licensedContent: boolean;
  regionRestriction?: {
    allowed?: string[];
    blocked?: string[];
  };
}

export interface YouTubeStatistics {
  viewCount: string;
  likeCount?: string;
  dislikeCount?: string;
  favoriteCount?: string;
  commentCount?: string;
}

export interface YouTubeVideoDetails {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubeSnippet;
  contentDetails?: YouTubeContentDetails;
  statistics?: YouTubeStatistics;
}

export interface YouTubeVideoDetailsResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoDetails[];
}

//! Processed Video Types
export interface VideoSearchResult {
  videoId: string;
  title: string;
  creator: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  viewCount: number;
  durationMinutes: number;
  publishedAt: string;
  description: string;
}

//! Cache and Pool Types
export interface VideoPool {
  videos: CachedVideo[];
  timestamp: number;
  query: string;
}

export interface UserDayCache {
  videos: CachedVideo[];
  refreshCount: number;
  date: string;
}

export interface RefreshStatus {
  canRefresh: boolean;
  count: number;
}

//! Utility Types
export interface HtmlEntities {
  [key: string]: string;
}

//! Extended Klap API Types
export interface SSEUpdateData {
  status: string;
  message: string;
  progress?: number;
  tokens_remaining?: number;
  task_id?: string;
  attempt?: number;
  max_attempts?: number;
  project_id?: string;
  total_shorts?: number;
  short_info?: {
    title: string;
    virality_score: number;
    id: string;
  };
  export_id?: string;
  download_url?: string;
  error?: string;
  error_code?: string;
  error_details?: string;
  final_status?: string;
  result_data?: unknown;
  debug_info?: {
    response_type: string;
    response_keys: string[] | null;
    is_array: boolean;
    response_sample: unknown;
  };
  suggestion?: string;
  wait_time?: number;
  export_status?: string;
  short?: ExportedShort;
  short_title?: string;
  virality_score?: number;
}

export interface ExportedShort {
  id: string;
  title: string;
  virality_score: number;
  duration?: number;
  transcript?: string;
  description?: string;
  captions?: PublicationCaptions;
  export_status: string;
  download_url: string | null;
  export_id: string;
}

export interface PublicationCaptions {
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  instagram?: string;
}

export interface TaskPayload {
  source_video_url: string;
  target_clip_count: number;
  max_clip_count: number;
  min_duration: number;
  max_duration: number;
  target_duration: number;
  editing_options: {
    captions: boolean;
    reframe: boolean;
    emojis: boolean;
    intro_title: boolean;
    remove_silences: boolean;
    width: number;
    height: number;
  };
}

export interface TaskResponse {
  id: string;
  status?: string;
  error_code?: string;
  message?: string;
}

export interface PollResponse {
  status: string;
  output_id?: string;
  error?: unknown;
}

export interface KlapShort {
  id: string;
  name: string;
  folder_id: string;
  virality_score: number;
  virality_score_explanation?: string;
  duration?: number;
  transcript_text?: string;
  publication_captions?: PublicationCaptions;
}

export interface ExportResponse {
  id: string;
  status?: string;
  src_url?: string;
  download_url?: string;
}

export interface ProjectResponse {
  shorts?: KlapShort[];
  data?: KlapShort[];
  results?: KlapShort[];
  items?: KlapShort[];
}

export interface UserShort {
  title: string;
  virality_score: number;
  description?: string;
  captions: {
    tiktok: string;
    youtube: string;
    linkedin: string;
    instagram: string;
  };
  download_url: string;
  created_at?: Date;
}

export interface UserShortsDocument {
  _id?: ObjectId;
  userid: string;
  shorts: UserShort[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocument {
  _id: ObjectId;
  username: string;
  name: string;
  email: string;
  password: string;
  reeruToken: number;
  isProcessingVideo?: boolean;
  telegramChatId?: number;
}

export interface UserPreference {
  userId: string;
  languagePreference?: string;
}

//! Video and History Types
export interface Video {
  title: string;
  creator: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  duration: string;
  reasoning: string;
}

export interface History {
  _id?: ObjectId;
  userId: string;
  contentPreference: string;
  languagePreference: string;
  videos: Video[];
  source: string;
  timestamp: Date;
  createdAt?: Date;
}
