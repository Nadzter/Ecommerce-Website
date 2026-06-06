import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Sign up" };

export default function SignUpPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <SignUp signInUrl="/sign-in" />
    </div>
  );
}
