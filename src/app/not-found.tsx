import Link from "next/link";
import { AlertCircle, Home, LayoutDashboard, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-lg items-center justify-center px-4 py-12">
      <Card className="border-border w-full text-center shadow-sm">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-semibold text-[#18181b]">
            Halaman Tidak Ditemukan
          </CardTitle>
          <CardDescription className="text-sm text-[#65656f]">
            Workspace pawiwahan atau halaman yang Anda tuju tidak ditemukan atau
            tautan yang Anda gunakan tidak valid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#8c8c99]">
            Pastikan format URL atau ID workspace sudah benar, atau kembali ke
            daftar workspace Anda.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/workspaces">
              <LayoutDashboard className="h-4 w-4" /> Daftar Workspace
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/workspace/new">
              <PlusCircle className="h-4 w-4" /> Buat Workspace Baru
            </Link>
          </Button>
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Beranda
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
