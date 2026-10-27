import AuthFrame from "../components/learner/AuthFrame";
import { ButtonLink, Card } from "../components/ui";
export default function RecoveryPage() {
  return (
    <AuthFrame>
      <h1>Help signing in</h1>
      <Card>
        <h2>Recover access with your program</h2>
        <p>
          This site does not currently send password-reset emails or texts. No
          recovery message has been sent.
        </p>
        <p>
          Contact the program staff who invited you, in person or through a
          contact you already trust. Ask them to review your account access and
          arrange identity-verified recovery with the service operator. Do not
          create a second account to replace saved progress or a balance.
        </p>
        <p>
          Never share your password or payment details with someone offering to
          recover your account. Staff should follow their verified support
          process.
        </p>
        <p>
          If you were exploring as a guest, keep using the same browser and do
          not clear its cookies while asking for help.
        </p>
      </Card>
      <ButtonLink href="/login">Return to sign in</ButtonLink>
    </AuthFrame>
  );
}
