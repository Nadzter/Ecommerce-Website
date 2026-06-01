import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign in" };

export default function SignInPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <SignIn signUpUrl="/sign-up" />
    </div>
  );
}
