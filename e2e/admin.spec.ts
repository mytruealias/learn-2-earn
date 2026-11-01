/** Preserve the legacy browser command, with real seeded/MFA/role/workflow assertions.
 * The old suite assumed live fixture credentials and swallowed missing actions;
 * these current suites fail on missing controls, denied operations or wrong results.
 */
import "./staff-operations.spec";
import "./rewards.spec";
