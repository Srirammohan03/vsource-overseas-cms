// src\app\admin\admin-navigation.ts
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  HardDrive,
  Images,
  LayoutDashboard,
  MapPinned,
  Settings as SettingsIcon,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminModule =
  | "dashboard"
  | "destinations"
  | "universities"
  | "courses"
  | "gallery"
  | "enquiries"
  | "media"
  | "users"
  | "settings";

export const adminNavigation: { id: AdminModule; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "destinations", label: "Study Destinations", icon: MapPinned },
  { id: "universities", label: "Universities", icon: GraduationCap },
  { id: "courses", label: "University Courses", icon: BookOpen },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "enquiries", label: "Enquiries", icon: ClipboardList },
  { id: "media", label: "Media Library", icon: HardDrive },
  { id: "users", label: "Admin Users", icon: Users },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];
