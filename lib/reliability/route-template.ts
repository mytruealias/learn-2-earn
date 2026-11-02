/** No IDs, search strings or arbitrary locations enter client operational reports. */
export function routeTemplate(pathname: string) {
    if (/^\/paths\/[^/]+\/?$/.test(pathname))
        return "/paths/[pathSlug]";
    if (/^\/lesson\/[^/]+\/?$/.test(pathname))
        return "/lesson/[lessonId]";
    if (/^\/admin\/cases\/[^/]+\/?$/.test(pathname))
        return "/admin/cases/[id]";
    if (/^\/admin\/users\/[^/]+\/?$/.test(pathname))
        return "/admin/users/[userId]";
    const safe = ["/", "/app", "/login", "/signup", "/access", "/onboarding", "/recover", "/practice", "/profile", "/lifeline", "/demo", "/privacy", "/terms", "/admin", "/admin/login", "/admin/programs", "/admin/security", "/admin/users", "/admin/cases", "/admin/payouts", "/admin/finance", "/admin/reports", "/admin/directory", "/admin/staff", "/admin/audit", "/admin/inquiries"];
    if (safe.includes(pathname))
        return pathname;
    if (/^\/(austin|dallas|houston|denver|los-angeles|san-francisco)(\/unlock)?$/.test(pathname))
        return "/[city]";
    return "/other";
}
