import {
  BadgeCheck, BedDouble, BookOpenCheck, Building2, Bus, CalendarCheck, CalendarCog,
  CalendarRange, ClipboardList, GraduationCap, IndianRupee, Library, MessageSquare,
  NotebookPen, Package, ShieldCheck, Square, Users,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  BadgeCheck, BedDouble, BookOpenCheck, Building2, Bus, CalendarCheck, CalendarCog,
  CalendarRange, ClipboardList, GraduationCap, IndianRupee, Library, MessageSquare,
  NotebookPen, Package, ShieldCheck, Users,
};

export function iconFor(name: string): LucideIcon {
  return icons[name] ?? Square;
}
