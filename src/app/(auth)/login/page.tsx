import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-lg items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Masuk ke Patemon</CardTitle>
          <CardDescription>
            Akses workspace perencanaan pernikahan keluarga Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed">
            <Badge variant="secondary" className="mb-2 text-[10px]">
              Placeholder Rute Auth
            </Badge>
            <p>
              Autentikasi Supabase (Email & Google OAuth) serta integrasi Row
              Level Security (RLS) akan diimplementasikan pada{" "}
              <strong>Issue #15</strong> dan <strong>Issue #18</strong>.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" disabled>
            Login via Supabase (Segera Hadir)
          </Button>
          <Button variant="ghost" className="w-full gap-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
