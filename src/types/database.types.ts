export type UserRole = "barber" | "client";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentStatus = "not_required" | "pending" | "paid" | "refunded" | "failed";

export type NotificationType =
  | "appointment_requested"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_completed"
  | "waitlist_slot_open";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  no_show_count: number;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  cancellation_cutoff_minutes: number;
  created_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  is_active: boolean;
  created_at: string;
}

export interface ShopHour {
  id: string;
  shop_id: string;
  day_of_week: number; // 0 = Sunday ... 6 = Saturday
  open_time: string | null; // "HH:MM:SS"
  close_time: string | null;
  is_closed: boolean;
}

export interface ShopStaff {
  id: string;
  shop_id: string;
  profile_id: string | null;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ShopPhoto {
  id: string;
  shop_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  shop_id: string;
  service_id: string;
  staff_id: string | null;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  deposit_amount: number;
  payment_status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  shop_id: string;
  appointment_id: string | null;
  client_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  appointment_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  shop_id: string;
  service_id: string | null;
  client_id: string;
  preferred_date: string; // "YYYY-MM-DD"
  notified_at: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  client_id: string;
  shop_id: string;
  created_at: string;
}

export interface AppointmentServiceRow {
  id: string;
  appointment_id: string;
  service_id: string;
  price: number;
  duration_minutes: number;
  deposit_amount: number;
  created_at: string;
}

export interface NearbyShop {
  id: string;
  name: string;
  city: string;
  area: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
  avg_rating: number | null;
  review_count: number;
}

// Minimal Database generic so `createClient<Database>()` type-checks.
// Extend this per-table if you want full query-builder type inference.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      shops: { Row: Shop; Insert: Partial<Shop>; Update: Partial<Shop> };
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      shop_hours: { Row: ShopHour; Insert: Partial<ShopHour>; Update: Partial<ShopHour> };
      appointments: { Row: Appointment; Insert: Partial<Appointment>; Update: Partial<Appointment> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
      shop_staff: { Row: ShopStaff; Insert: Partial<ShopStaff>; Update: Partial<ShopStaff> };
      shop_photos: { Row: ShopPhoto; Insert: Partial<ShopPhoto>; Update: Partial<ShopPhoto> };
      notifications: { Row: NotificationRow; Insert: Partial<NotificationRow>; Update: Partial<NotificationRow> };
      waitlist_entries: { Row: WaitlistEntry; Insert: Partial<WaitlistEntry>; Update: Partial<WaitlistEntry> };
      favorites: { Row: Favorite; Insert: Partial<Favorite>; Update: Partial<Favorite> };
      appointment_services: { Row: AppointmentServiceRow; Insert: Partial<AppointmentServiceRow>; Update: Partial<AppointmentServiceRow> };
    };
  };
}