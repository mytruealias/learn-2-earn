/** Pure error type: public validation helpers must not initialize a private database. */
export class ScopeError extends Error {
  constructor(
    public status = 403,
    message = "This action is unavailable in your active program.",
  ) {
    super(message);
  }
}
