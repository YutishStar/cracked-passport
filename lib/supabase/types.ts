// Hand-authored types mirroring supabase/migrations/0001_init.sql.
// Keep in sync with the schema.

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type FellowStatus = "invited" | "claimed" | "revoked";
export type PassportStatus = "pending" | "issued" | "deferred" | "failed";
export type ChainName = "fuji" | "avalanche";
export type StampKind = "house" | "special";
export type TimelineKind =
  | "accepted"
  | "claimed"
  | "house_arrival"
  | "house_departure"
  | "stamp"
  | "achievement"
  | "perk"
  | "custom";

export interface FellowLinks {
  github?: string;
  linkedin?: string;
  x?: string;
  portfolio?: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  github_url: string | null;
  links: FellowLinks;
  answers: Record<string, string>;
  status: ApplicationStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  fellow_id: string | null;
  created_at: string;
}

export interface Fellow {
  id: string;
  fellow_number: number;
  application_id: string | null;
  clerk_user_id: string | null;
  username: string | null;
  display_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  links: FellowLinks;
  current_startup: string | null;
  current_house_id: string | null;
  status: FellowStatus;
  claimed_at: string | null;
  created_at: string;
}

export interface ClaimToken {
  id: string;
  fellow_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  fellow_id: string;
  address: string;
  chain: ChainName;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface Passport {
  id: string;
  fellow_id: string;
  token_id: number | null;
  contract_address: string | null;
  chain: ChainName | null;
  tx_hash: string | null;
  metadata_cid: string | null;
  status: PassportStatus;
  issued_at: string | null;
  created_at: string;
}

export interface House {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  flag: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HouseResidency {
  id: string;
  fellow_id: string;
  house_id: string;
  arrived_on: string;
  departed_on: string | null;
  created_at: string;
}

export interface StampType {
  id: string;
  slug: string;
  name: string;
  house_id: string | null;
  artwork_url: string | null;
  kind: StampKind;
  created_at: string;
}

export interface FellowStamp {
  id: string;
  fellow_id: string;
  stamp_type_id: string;
  issued_by: string | null;
  note: string | null;
  seen_at: string | null;
  issued_at: string;
}

export interface AchievementType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
}

export interface FellowAchievement {
  id: string;
  fellow_id: string;
  achievement_type_id: string;
  issued_by: string | null;
  note: string | null;
  seen_at: string | null;
  issued_at: string;
}

export interface Sponsor {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  url: string | null;
  created_at: string;
}

export interface Perk {
  id: string;
  sponsor_id: string | null;
  name: string;
  description: string | null;
  redemption_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FellowPerk {
  id: string;
  fellow_id: string;
  perk_id: string;
  assigned_at: string;
  redeemed_at: string | null;
}

export interface TimelineEvent {
  id: string;
  fellow_id: string;
  kind: TimelineKind;
  title: string;
  subtitle: string | null;
  occurred_at: string;
  ref_id: string | null;
  is_public: boolean;
  created_at: string;
}
