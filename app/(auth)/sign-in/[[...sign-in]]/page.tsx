import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-paper px-6">
      <SignIn
        appearance={{
          elements: {
            rootBox: "shadow-none",
            card: "shadow-none border border-black/[0.06]",
          },
        }}
      />
    </main>
  );
}
