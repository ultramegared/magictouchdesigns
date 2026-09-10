import type { NavigationItem } from "../types/navigation";

const fallback: NavigationItem[] = [
    { id: 1, label: "Home", path: "/" },
    { id: 2, label: "Products", path: "/products" },
    { id: 3, label: "Collections", path: "/collections" },
    { id: 4, label: "Customize", path: "/customize" },
    { id: 5, label: "Contact", path: "/contact" },
];

const read = (): NavigationItem[] => {
    try {
        const raw = localStorage.getItem("mtd_site_config");
        const config = raw ? JSON.parse(raw) : null;
        const links = config?.headerLinks;
        if (Array.isArray(links) && links.length) {
            return links
                .filter((item: any) => item.active)
                .sort((a: any, b: any) => a.order - b.order)
                .map((item: any) => ({ id: item.id, label: item.label?.en || item.label || "", path: item.path }));
        }
    } catch {}
    return fallback;
};

export const navigation: NavigationItem[] = new Proxy(fallback, {
    get(target, property) {
        const current = read();
        if (property === "map") return (...args: any[]) => (current.map as any)(...args);
        if (property === "filter") return (...args: any[]) => (current.filter as any)(...args);
        if (property === "length") return current.length;
        if (property === Symbol.iterator) return current[Symbol.iterator].bind(current);
        return (target as any)[property];
    },
}) as NavigationItem[];
