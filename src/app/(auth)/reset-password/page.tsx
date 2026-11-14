import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-md items-center justify-center px-4 py-12">
      <Card className="border-border/80 w-full shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Lupa Kata Sandi?</CardTitle>
          <CardDescription>
            Masukkan email Anda untuk menerima instruksi pemulihan kata sandi
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResetPasswordForm />
        </CardContent>

        <CardFooter className="text-muted-foreground border-border/40 flex justify-center border-t pt-2 text-center text-xs">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman Masuk
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
