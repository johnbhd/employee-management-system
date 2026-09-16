const icon = (className, extraClass = 'h-5 w-5') => [
    '<i class="', className, ' ', extraClass, ' inline-flex shrink-0 items-center justify-center text-center" aria-hidden="true"></i>'
].join('');

const icons = {
    dashboard: icon('fa-solid fa-table-columns'),
    monitoring: icon('fa-solid fa-chart-line'),
    hrps: icon('fa-solid fa-building'),
    bundy: icon('fa-solid fa-clock'),
    qr: icon('fa-solid fa-qrcode'),
    unified: icon('fa-solid fa-layer-group'),
    payroll: icon('fa-solid fa-money-check-dollar'),
    accounting: icon('fa-solid fa-building-columns'),
    errors: icon('fa-solid fa-triangle-exclamation'),
    users: icon('fa-solid fa-users'),
    roles: icon('fa-solid fa-user-shield'),
    audit: icon('fa-solid fa-list-check'),
    settings: icon('fa-solid fa-gear'),
    close: icon('fa-solid fa-xmark', 'h-4 w-4'),
    logout: icon('fa-solid fa-right-from-bracket'),
    user: icon('fa-solid fa-user')
};

const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', href: './dashboard.html', icon: icons.dashboard },
    { id: 'integration-monitoring', label: 'Integration Monitoring', href: './integration-monitoring.html', icon: icons.monitoring },
    { id: 'hrps-integration', label: 'HRPS Integration', href: './hrps-integration.html', icon: icons.hrps },
    { id: 'bundy-biometric-etl', label: 'Bundy / Biometric ETL', href: './bundy-biometric-etl.html', icon: icons.bundy },
    { id: 'qr-attendance', label: 'QR Attendance', href: './qr-attendance.html', icon: icons.qr },
    { id: 'unified-attendance', label: 'Unified Attendance', href: './unified-attendance.html', icon: icons.unified },
    { id: 'payroll-integration', label: 'Payroll Integration', icon: icons.payroll },
    { id: 'accounting-integration', label: 'Accounting Integration', icon: icons.accounting },
    { id: 'integration-errors', label: 'Integration Errors', icon: icons.errors },
    { id: 'user-accounts', label: 'User Accounts', icon: icons.users },
    { id: 'roles-permissions', label: 'Roles & Permissions', icon: icons.roles },
    { id: 'audit-logs', label: 'Audit Logs', icon: icons.audit },
    { id: 'system-settings', label: 'System Settings', icon: icons.settings }
];

function navigationItem(item, activePage) {
    const isActive = item.id === activePage;
    const activeClass = isActive ? ' is-active' : '';
    const currentPage = isActive ? ' aria-current="page"' : '';

    if (!item.href) {
        return [
            '<span class="sidebar-link sidebar-link-placeholder" aria-disabled="true">',
            item.icon,
            '<span class="min-w-0 flex-1 truncate">', item.label, '</span>',
            '</span>'
        ].join('');
    }

    return [
        '<a href="', item.href, '" class="sidebar-link', activeClass, '" data-nav-link', currentPage, '>',
        item.icon,
        '<span class="min-w-0 flex-1 truncate">', item.label, '</span>',
        '</a>'
    ].join('');
}

export function Sidebar(activePage = 'dashboard') {
    const navigationMarkup = navigationItems.map((item) => navigationItem(item, activePage)).join('');

    return [
        '<div id="sidebar-overlay" class="fixed inset-0 z-40 hidden bg-slate-950/60 backdrop-blur-sm lg:hidden" data-sidebar-overlay aria-hidden="true"></div>',
        '<aside id="admin-sidebar" class="sidebar-panel fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col bg-au-navy text-white shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0" data-sidebar-panel aria-label="IT Administrator navigation">',
            '<div class="flex min-h-0 flex-1 flex-col">',
                '<div class="flex items-start justify-between border-b border-white/10 px-5 pb-5 pt-6">',
                    '<a href="./dashboard.html" class="flex min-w-0 items-center gap-3" aria-label="Arellano University dashboard">',
                        '<img class="h-11 w-11 shrink-0 object-contain" src="../img/aulogo.png" alt="Arellano University logo" />',
                        '<span class="min-w-0">',
                            '<span class="block truncate text-[11px] font-extrabold tracking-[0.16em] text-white">ARELLANO UNIVERSITY</span>',
                            '<span class="mt-1 block text-xs font-medium text-blue-100/70">Juan Sumulong Campus</span>',
                        '</span>',
                    '</a>',
                    '<button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-blue-100/70 transition hover:bg-white/10 hover:text-white lg:hidden" data-sidebar-close aria-label="Close navigation menu">',
                        icons.close,
                    '</button>',
                '</div>',
                '<div class="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">',
                    '<div class="mb-4 flex items-center justify-between px-2">',
                        '<span class="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/55">Workspace</span>',
                        '<span class="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-blue-100/70">IT Administrator</span>',
                    '</div>',
                    '<nav class="space-y-1" aria-label="Primary navigation">',
                        navigationMarkup,
                    '</nav>',
                '</div>',
                '<div class="border-t border-white/10 px-4 pb-5 pt-4">',
                    '<div class="rounded-2xl border border-white/10 bg-white/5 p-3.5">',
                        '<div class="flex items-center justify-between gap-3">',
                            '<div class="flex items-center gap-2 text-xs font-semibold text-blue-50">',
                                '<span class="status-dot status-dot-online"></span>',
                                '<span>Integration layer</span>',
                            '</div>',
                            '<span class="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-200">Live</span>',
                        '</div>',
                        '<p class="mt-2 text-[11px] leading-5 text-blue-100/60">Six connected services monitored from one control center.</p>',
                    '</div>',
                    '<div class="mt-4 flex items-center gap-3">',
                        '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-100">',
                            icons.user,
                        '</span>',
                        '<div class="min-w-0 flex-1">',
                            '<p class="truncate text-xs font-semibold text-white">IT Administrator</p>',
                            '<p class="mt-0.5 truncate text-[11px] text-blue-100/55">AU-JSC Admin Account</p>',
                        '</div>',
                        '<a href="../index.html" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-blue-100/60 transition hover:bg-white/10 hover:text-white" aria-label="Log out">',
                            icons.logout,
                        '</a>',
                    '</div>',
                    '<a href="../index.html" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-blue-100/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white">',
                        icons.logout,
                        '<span>Logout</span>',
                    '</a>',
                '</div>',
            '</div>',
        '</aside>'
    ].join('');
}
