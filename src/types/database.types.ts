// Hand-written types matching supabase/schema.sql.
// If you change the schema, regenerate with the Supabase CLI instead:
//   supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type UserRole = "barber" | "client";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
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
  created_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
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

export interface Appointment {
  id: string;
  shop_id: string;
  service_id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
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
    };
  };
}
