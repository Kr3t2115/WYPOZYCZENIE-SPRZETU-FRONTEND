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
    LucideIcon
} from "lucide-react";
import { ROLES } from "@/store/auth-store";

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
            { title: 'Lista sprzętów', href: '/equipments', icon: PackageSearch },
            { title: 'Rezerwacje', href: '/my-reservation', icon: Clock },
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
        ],
    },
    {
        title: 'Konfiguracja panelu',
        items: [
            { title: 'Kategorie', href: '/admin/categories', icon: Tag },
            { title: 'Atrybuty', href: '/admin/attributes', icon: SlidersHorizontal },
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
            { title: 'Zarządzanie Sprzętem IT', href: '/admin/inventory-all', icon: FolderPlus },
            { title: 'Uprawnienia i Logi', href: '/admin/system', icon: ShieldAlert },
        ],
    },
];

const getMenuItemsByRole = (role?: ROLES): MenuGroup[] => {
    switch (role) {
        case "STUDENT":
            return STUDENT_MENU;
        case "SECRETARY":
            return SECRETARIAT_MENU;
        case "IT_STUFF":
            return IT_MENU;
        default:
            return [];
    }
}

export { getMenuItemsByRole };