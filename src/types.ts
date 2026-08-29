export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_field_owner?: boolean;
  is_instructor?: boolean;
  is_admin?: boolean;
  expo_push_token?: string | null;
  push_enabled?: boolean;
  created_at: string;
};

export type RoleRequestRole = 'field_owner' | 'instructor';
export type RoleRequestStatus = 'pending' | 'accepted' | 'rejected';

export type RoleRequest = {
  id: string;
  user_id: string;
  role: RoleRequestRole;
  note: string | null;
  description: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  status: RoleRequestStatus;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profiles?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type ListingType = 'field' | 'lesson';

export type Listing = {
  id: string;
  owner_id: string;
  type: ListingType;
  title: string;
  description: string | null;
  sport: string;
  city: string;
  district: string;
  price: number;
  image_url: string | null;
  open_hour?: number;
  close_hour?: number;
  open_days?: number[];
  duration_minutes?: number;
  created_at: string;
  profiles?: Profile;
  avg_rating?: number;
  review_count?: number;
};

export type ListingReview = {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: Profile;
};

export type PurchaseStatus = 'pending' | 'accepted' | 'rejected';

export type Purchase = {
  id: string;
  user_id: string;
  listing_id: string;
  status: PurchaseStatus;
  slot_date?: string | null;
  slot_time?: string | null;
  created_at: string;
  profiles?: Profile;
};

export type DuelLevel = 'baslangic' | 'orta' | 'ileri';

export type Duel = {
  id: string;
  creator_id: string;
  sport: string;
  title: string;
  description: string | null;
  city: string;
  district: string;
  match_date: string;
  start_time: string;
  max_players: number;
  level: DuelLevel;
  created_at: string;
  profiles?: Profile;
  participant_count?: number;
  joined_by_me?: boolean;
};

export type SharedPost = {
  id: string;
  image_url: string;
  caption: string | null;
};

export type SharedListing = {
  id: string;
  title: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  post_id?: string | null;
  listing_id?: string | null;
  shared_post?: SharedPost | null;
  shared_listing?: SharedListing | null;
  profiles?: Profile;
};

export const SPORTS = ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Masa Tenisi', 'Badminton'] as const;

export const LEVEL_LABELS: Record<DuelLevel, string> = {
  baslangic: 'Başlangıç',
  orta: 'Orta',
  ileri: 'İleri Seviye',
};
