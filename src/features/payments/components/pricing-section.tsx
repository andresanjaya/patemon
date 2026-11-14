import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRICING_TIERS } from "../pricing";
import { formatRupiah } from "@/features/workspaces/validation";

interface PricingSectionProps {
  showTitle?: boolean;
}

export function PricingSection({ showTitle = true }: PricingSectionProps) {
  return (
    <section id="pricing" className="space-y-12">
      {showTitle && (
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Badge
            variant="secondary"
            className="border-primary/30 bg-primary/10 text-primary gap-1 px-3 py-1 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Biaya Transparan & Sekali Bayar</span>
          </Badge>

          <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pilihan Akses Tanpa Biaya Berlangganan
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            Patemon dirancang dengan prinsip gotong royong (*ngayah*). Anda
            cukup membayar satu kali untuk satu workspace pawiwahan, tanpa
            tagihan bulanan atau perpanjangan tersembunyi.
          </p>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
        {PRICING_TIERS.map((tier) => (
          <Card
            key={tier.id}
            className={`flex flex-col justify-between transition-all duration-200 ${
              tier.popular
                ? "border-primary ring-primary/20 bg-card relative shadow-lg ring-1"
                : "border-border/80 bg-card/60 shadow-sm"
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge
                  className={`px-3 py-1 text-xs font-semibold shadow-xs ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {tier.badge}
                </Badge>
              </div>
            )}

            <div>
              <CardHeader className="pt-8 pb-4">
                <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="min-h-[32px] text-xs leading-relaxed">
                  {tier.tagline}
                </CardDescription>

                <div className="mt-4 pt-2">
                  <div className="flex items-baseline gap-2">
                    {tier.originalPrice && (
                      <span className="text-muted-foreground text-sm line-through">
                        {formatRupiah(tier.originalPrice)}
                      </span>
                    )}
                    <span className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
                      {tier.priceLabel}
                    </span>
                  </div>
                  <span className="text-muted-foreground mt-1 block text-[11px]">
                    {tier.periodLabel}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-2 pb-6">
                <div className="border-border/60 space-y-3 border-t pt-4">
                  <span className="text-foreground block text-xs font-semibold">
                    Fitur yang didapatkan:
                  </span>
                  <ul className="space-y-2.5 text-xs">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <div className="bg-primary/10 text-primary mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="bg-muted text-muted-foreground/60 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                            <X className="h-3 w-3" />
                          </div>
                        )}
                        <div className="leading-tight">
                          <span
                            className={
                              feature.included
                                ? "text-foreground"
                                : "text-muted-foreground line-through opacity-70"
                            }
                          >
                            {feature.text}
                          </span>
                          {feature.note && (
                            <span className="text-muted-foreground mt-0.5 block text-[10px] italic">
                              ({feature.note})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </div>

            <CardFooter className="border-border/40 border-t pt-2 pb-6">
              <Button
                asChild
                variant={tier.popular ? "default" : "outline"}
                className="w-full gap-2 py-5 text-xs font-semibold"
              >
                <Link href={tier.ctaHref}>
                  <span>{tier.ctaLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Security and Adat Philosophy Guarantee */}
      <div className="border-primary/20 bg-primary/5 text-muted-foreground mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border p-4 text-xs sm:flex-row sm:p-5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Heart className="text-primary h-5 w-5" />
          </div>
          <div className="leading-relaxed">
            <p className="text-foreground font-semibold">
              Dedikasi untuk Yadnya & Tradisi Bali
            </p>
            <p className="text-muted-foreground text-[11px]">
              Setiap lisensi mendukung kelangsungan kurasi data upakara dan
              pemeliharaan platform gotong royong pernikahan Hindu Bali.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[11px]">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Garansi 7 Hari Pengembalian</span>
        </div>
      </div>
    </section>
  );
}
