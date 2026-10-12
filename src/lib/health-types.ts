export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
export type BloodSugarContext = "fasting" | "before_meal" | "after_meal" | "random";
export type ComponentStatus = "good" | "caution" | "alert";

export interface ProfileResponse {
  user: { id: string; name: string | null; email: string | null; created_at: string };
  profile: {
    date_of_birth: string | null;
    age: number | null;
    gender: Gender | null;
    height_cm: number | null;
    blood_type: string | null;
    phone: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    medical_conditions: string | null;
    allergies: string | null;
    current_medications: string | null;
    updated_at: string | null;
  };
}

export interface HealthRecord {
  id: string;
  recorded_at: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  body_temperature_c: number | null;
  blood_sugar_mgdl: number | null;
  blood_sugar_context: BloodSugarContext | null;
  sleep_hours: number | null;
  water_intake_liters: number | null;
  activity_minutes: number | null;
  activity_type: string | null;
  wellness_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type HealthRecordInput = Partial<
  Omit<HealthRecord, "id" | "bmi" | "wellness_score" | "created_at" | "updated_at">
>;

export interface ScoreComponent {
  metric: string;
  label: string;
  score: number;
  status: ComponentStatus;
  message: string;
}

export interface HealthAlert {
  metric: string;
  level: "caution" | "alert";
  message: string;
}

export interface RecordResult {
  record: HealthRecord;
  components: ScoreComponent[];
  alerts: HealthAlert[];
}

export interface SnapshotMetrics {
  height_cm: number | null;
  weight_kg: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  body_temperature_c: number | null;
  blood_sugar_mgdl: number | null;
  blood_sugar_context: string | null;
  sleep_hours: number | null;
  water_intake_liters: number | null;
  activity_minutes: number | null;
}

export interface Snapshot {
  as_of: string | null;
  metrics: SnapshotMetrics;
  bmi: number | null;
  bmi_category: string | null;
  wellness_score: number | null;
  wellness_label: string | null;
  components: ScoreComponent[];
  alerts: HealthAlert[];
}

export interface Averages {
  weight_kg: number | null;
  bmi: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  body_temperature_c: number | null;
  blood_sugar_mgdl: number | null;
  sleep_hours: number | null;
  water_intake_liters: number | null;
  activity_minutes: number | null;
  wellness_score: number | null;
  record_count: number;
}

export interface TrendPoint {
  date: string;
  weight_kg: number | null;
  bmi: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  body_temperature_c: number | null;
  blood_sugar_mgdl: number | null;
  sleep_hours: number | null;
  water_intake_liters: number | null;
  activity_minutes: number | null;
  wellness_score: number | null;
}

export interface DashboardData {
  snapshot: Snapshot;
  latest_record: HealthRecord | null;
  averages_7d: Averages;
  trend: TrendPoint[];
  total_records: number;
  streak_days: number;
  unread_notifications: number;
  disclaimer: string;
}

export type Duration = "less_than_24h" | "1_3_days" | "4_7_days" | "1_2_weeks" | "more_than_2_weeks";
export type Severity = "mild" | "moderate" | "severe";
export type UrgencyLevel = "self_care" | "monitor" | "consult_doctor" | "urgent_care" | "emergency";

export interface CatalogSymptom {
  id: string;
  label: string;
  category: string;
  red_flag: boolean;
}

export interface SymptomGuidance {
  urgency_level: UrgencyLevel;
  headline: string;
  summary: string;
  recommendations: string[];
  self_care_tips: string[];
  see_doctor_if: string[];
  red_flags_detected: string[];
  related_areas: string[];
  disclaimer: string;
}

export interface SymptomCheck {
  id: string;
  symptoms: { id: string; label: string }[];
  duration: Duration;
  severity: Severity;
  urgency_level: UrgencyLevel;
  guidance: SymptomGuidance;
  notes: string | null;
  created_at: string;
}

export type ReminderType = "checkup" | "medication" | "exercise" | "water" | "other";
export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface Reminder {
  id: string;
  title: string;
  reminder_type: ReminderType;
  reminder_time: string;
  days_of_week: Weekday[];
  notes: string | null;
  is_active: boolean;
  last_completed_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodayReminder extends Reminder {
  completed_today: boolean;
  is_due: boolean;
}

export interface AppNotification {
  id: string;
  reminder_id: string | null;
  title: string;
  message: string;
  notification_type: "reminder" | "health_alert" | "system";
  is_read: boolean;
  created_at: string;
}

export interface HealthReport {
  generated_at: string;
  period: { from: string; to: string; days: number };
  user: { name: string | null; email: string | null };
  profile: {
    age: number | null;
    gender: string | null;
    height_cm: number | null;
    blood_type: string | null;
    medical_conditions: string | null;
    allergies: string | null;
    current_medications: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  };
  snapshot: Snapshot;
  averages: Averages;
  trend: TrendPoint[];
  records: HealthRecord[];
  symptom_checks: {
    id: string;
    symptoms: { id: string; label: string }[];
    duration: string;
    severity: string;
    urgency_level: string;
    created_at: string;
  }[];
  insights: string[];
  disclaimer: string;
}
