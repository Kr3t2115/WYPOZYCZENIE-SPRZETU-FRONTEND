import {
    Clock,
    FileCheck,
    FolderPlus,
    LayoutDashboard,
    PackageSearch,
    QrCode,
    Users,
    History,
    Wrench,
    ShieldAlert,
    Tag,
    SlidersHorizontal,
    CalendarIcon,
    ClipboardCheck,
    PackagePlus,
    LucideIcon
} from "lucide-react";
import { ROLE_TYPE } from "@/store/auth-store";

export interface MenuItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

export interface MenuGroup {
    title?: string;
    items: MenuItem[];
}

const STUDENT_MENU: MenuGroup[] = [
    {
        items: [
            { title: 'Pulpit', href: '/dashboard', icon: LayoutDashboard },
            { title: 'Lista sprzętów', href: '/equipment', icon: PackageSearch },
            { title: 'Rezerwacje', href: '/my-reservations', icon: Clock },
            { title: 'Wypożyczenia', href: '/my-rentals', icon: CalendarIcon,},
            { title: 'Przedłużenia', href: '/my-rentals/extensions', icon: CalendarIcon,},
            { title: 'Uszkodzenia', href: '/my-rentals/faults', icon: CalendarIcon,},
        ],
    },
];

const SECRETARIAT_MENU: MenuGroup[] = [
    {
        items: [
            { title: 'Pulpit', href: '/dashboard', icon: LayoutDashboard },
            { title: 'Wydaj / Odbierz Sprzęt', href: '/desk/checkout', icon: QrCode },
            { title: 'Wnioski i Rezerwacje', href: '/desk/requests', icon: FileCheck },
            { title: 'Inwentarz i Sprzęt', href: '/desk/inventory', icon: FolderPlus },
            { title: 'Historia Wypożyczeń', href: '/desk/history', icon: History },
            { title: 'Przedłużenia', href: '/desk/extensions', icon: CalendarIcon },
            { title: 'Usterki', href: '/desk/faults', icon: Wrench },
            { title: 'Inspekcje', href: '/desk/inspections', icon: ClipboardCheck },
        ],
    },
    {
        title: 'Konfiguracja panelu',
        items: [
            { title: 'Kategorie', href: '/admin/categories', icon: Tag },
            { title: 'Atrybuty', href: '/admin/attributes', icon: SlidersHorizontal },
            { title: 'Dodaj sprzęt', href: '/admin/equipment/new', icon: PackagePlus },
            { title: 'Użytkownicy', href: '/admin/users', icon: Users },

        ],
    },
];

const IT_MENU: MenuGroup[] = [
    ...SECRETARIAT_MENU,
    {
        title: 'Administracja',
        items: [
            { title: 'Serwis i Awaria', href: '/admin/maintenance', icon: Wrench },
            { title: 'Uprawnienia i Logi', href: '/admin/system', icon: ShieldAlert },
        ],
    },
];

const getMenuItemsByRole = (role?: ROLE_TYPE): MenuGroup[] => {
    switch (role) {
        case "STUDENT":
            return STUDENT_MENU;
        case "SECRETARIAT":
            return SECRETARIAT_MENU;
        case "IT_STAFF":
            return IT_MENU;
        default:
            return [];
    }
}

export { getMenuItemsByRole };