import { getTestDatabaseUrl } from '../lib/test-database-safety';
getTestDatabaseUrl();
// No dotenv override: only the isolated test harness supplies database bindings.
process.env.SESSION_SECRET = 'test-session-secret-do-not-use-in-prod';
process.env.DEMO_ACCESS_CODE = 'TESTACCESS';
process.env.AUSTIN_ACCESS_PIN = '1234';
process.env.CITY_ACCESS_PIN = '9999';
