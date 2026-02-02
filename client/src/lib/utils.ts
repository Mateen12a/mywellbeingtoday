import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const labelMap: Record<string, string> = {
  mental_health: "Mental Health",
  wellbeing_insights: "Wellbeing Insights",
  emergency_services: "Emergency Services",
  general_practice: "General Practice",
  physical_therapy: "Physical Therapy",
  occupational_therapy: "Occupational Therapy",
  speech_therapy: "Speech Therapy",
  nutrition: "Nutrition",
  counseling: "Counseling",
  psychology: "Psychology",
  psychiatry: "Psychiatry",
  social_work: "Social Work",
  nursing: "Nursing",
  physiotherapy: "Physiotherapy",
  life_coaching: "Life Coaching",
  fitness: "Fitness",
  yoga: "Yoga",
  meditation: "Meditation",
  sleep_specialist: "Sleep Specialist",
  chronic_pain: "Chronic Pain",
  addiction: "Addiction",
  eating_disorders: "Eating Disorders",
  trauma: "Trauma",
  anxiety: "Anxiety",
  depression: "Depression",
  stress_management: "Stress Management",
  relationship: "Relationship",
  family_therapy: "Family Therapy",
  child_psychology: "Child Psychology",
  geriatric: "Geriatric Care",
  palliative: "Palliative Care",
  rehabilitation: "Rehabilitation",
  in_person: "In Person",
  video: "Video Call",
  phone: "Phone Call",
  online: "Online",
  exercise: "Exercise",
  relaxation: "Relaxation",
  social: "Social",
  work: "Work",
  sleep: "Sleep",
  hobby: "Hobby",
  self_care: "Self Care",
  mindfulness: "Mindfulness",
  therapy: "Therapy",
  medication: "Medication",
  outdoor: "Outdoor",
  creative: "Creative",
  learning: "Learning",
  spiritual: "Spiritual",
  other: "Other",
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  rescheduled: "Rescheduled",
  user: "User",
  provider: "Provider",
  admin: "Admin",
  manager: "Manager",
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
  verified: "Verified",
  unverified: "Unverified",
  rejected: "Rejected",
};

export function formatLabel(value: string | undefined | null): string {
  if (!value) return "";
  if (labelMap[value]) return labelMap[value];
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
