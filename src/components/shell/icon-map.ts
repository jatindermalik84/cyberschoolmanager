import {
  BadgeCheck, BedDouble, BookOpenCheck, Building2, Bus, Calculator, CalendarCheck, CalendarCog,
  CalendarRange, ClipboardList, GraduationCap, IndianRupee, LayoutGrid, Library, MessageSquare,
  NotebookPen, Package, PartyPopper, Search, Settings, ShieldCheck, Square, Stethoscope, Trophy,
  UserSearch, Users, Wallet,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  BadgeCheck, BedDouble, BookOpenCheck, Building2, Bus, Calculator, CalendarCheck, CalendarCog,
  CalendarRange, ClipboardList, GraduationCap, IndianRupee, LayoutGrid, Library, MessageSquare,
  NotebookPen, Package, PartyPopper, Search, Settings, ShieldCheck, Stethoscope, Trophy,
  UserSearch, Users, Wallet,
};

export function iconFor(name: string): LucideIcon {
  return icons[name] ?? Square;
}
