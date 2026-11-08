import type { ReactNode, SVGProps } from 'react';

export type IconName =
    | 'grid' | 'car' | 'arrow-in' | 'arrow-out' | 'layers' | 'history' | 'refresh' | 'search' | 'plus' | 'trash' | 'printer' | 'check' | 'alert' | 'chevron' | 'parking' | 'clock' | 'menu' | 'x' | 'activity' | 'wallet' | 'arrow-right' | 'info' | 'server' | 'shield';

export interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
}

const paths: Record<IconName, ReactNode> = {
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
    ),
    car: (
        <>
            <path d="M5 17h14l1-5-2.2-6H6.2L4 12l1 5Z" />
            <path d="M4 12h16M7 17v2M17 17v2" />
            <circle cx="7.5" cy="14.5" r=".7" />
            <circle cx="16.5" cy="14.5" r=".7" />
        </>
    ),
    'arrow-in': (
        <>
            <path d="M4 12h15m-6-6 6 6-6 6" />
            <path d="M20 4h2v16h-2" />
        </>
    ),
    'arrow-out': (
        <>
            <path d="M20 12H5m6-6-6 6 6 6" />
            <path d="M4 4H2v16h2" />
        </>
    ),
    layers: (
        <>
            <path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5" />
        </>
    ),
    history: (
        <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5M12 7v5l4 2" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6" />
        </>
    ),
    search: (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    trash: (
        <>
            <path d="M4 7h16M10 3h4l1 4H9l1-4ZM6 7l1 14h10l1-14M10 11v6M14 11v6" />
        </>
    ),
    printer: (
        <>
            <path d="M6 9V3h12v6M6 18H4V9h16v9h-2M6 14h12v7H6z" />
            <path d="M16 12h1" />
        </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
        <>
            <path d="M12 3 2 21h20L12 3ZM12 9v5m0 4h.01" />
        </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    parking: (
        <>
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    x: <path d="M5 5l14 14M19 5 5 19" />,
    activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,
    wallet: (
        <>
            <rect x="3" y="6" width="18" height="15" rx="3" />
            <path d="M3 10h18M7 6V3h11" />
            <path d="M16 15h2" />
        </>
    ),
    'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
        </>
    ),
    server: (
        <>
            <rect x="3" y="3" width="18" height="8" rx="2" />
            <rect x="3" y="13" width="18" height="8" rx="2" />
            <path d="M7 7h.01M7 17h.01" />
        </>
    ),
    shield: (
        <>
            <path d="m12 2 8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4" />
            <path d="m8.5 12 2.5 2.5 4.5-5" />
        </>
    ),
};

export default function Icon({ name, size = 20, className = '', ...props }: IconProps) {
    const iconPath = paths[name];

    if (!iconPath) return null;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
            {...props}
        >
            {iconPath}
        </svg>
    );
}