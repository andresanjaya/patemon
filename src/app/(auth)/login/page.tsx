import { Suspense } from "react";
import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

async function LoginFormWithParams({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <LoginForm redirectTo={params.redirectTo} initialError={params.error} />
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-md items-center justify-center px-4 py-12">
      <Card className="border-border/80 w-full shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
            <CalendarHeart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Masuk ke Patemon</CardTitle>
          <CardDescription>
            Akses workspace perencanaan pernikahan keluarga Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Suspense fallback={<LoginForm />}>
            <LoginFormWithParams searchParams={props.searchParams} />
          </Suspense>
        </CardContent>

        <CardFooter className="text-muted-foreground border-border/40 flex flex-col gap-3 border-t pt-2 text-center text-xs">
          <p>
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
