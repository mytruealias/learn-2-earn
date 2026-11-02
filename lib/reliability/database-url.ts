/** Bound Prisma's documented PostgreSQL connection/pool waits. Never print or log the result. */
export function boundedDatabaseUrl(value: string | undefined) {
    if (!value)
        return undefined;
    let url: URL;
    try {
        url = new URL(value);
    }
    catch {
        throw new Error("Database configuration is invalid.");
    }
    if (!["postgres:", "postgresql:"].includes(url.protocol))
        return value;
    for (const name of ["connect_timeout", "pool_timeout"]) {
        const configured = Number(url.searchParams.get(name));
        url.searchParams.set(name, String(Number.isInteger(configured) && configured > 0 ? Math.min(configured, 5) : 5));
    }
    return url.toString();
}
