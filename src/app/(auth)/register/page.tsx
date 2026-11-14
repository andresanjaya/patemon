import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-md items-center justify-center px-4 py-12">
      <Card className="border-border/80 w-full shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Mulai Rencana Pawiwahan
          </CardTitle>
          <CardDescription>
            Buat akun untuk memulai workspace persiapan pernikahan adat Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <RegisterForm />
        </CardContent>

        <CardFooter className="text-muted-foreground border-border/40 flex flex-col gap-3 border-t pt-2 text-center text-xs">
          <p>
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
