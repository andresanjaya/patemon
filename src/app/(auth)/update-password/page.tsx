import { LockKeyhole } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-md items-center justify-center px-4 py-12">
      <Card className="border-border/80 w-full shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Atur Ulang Kata Sandi
          </CardTitle>
          <CardDescription>
            Masukkan kata sandi baru untuk akun Patemon Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
