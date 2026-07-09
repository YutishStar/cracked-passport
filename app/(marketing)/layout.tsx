import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <div className="flex min-h-[100dvh] flex-col pt-[92px]">{children}</div>
      <SiteFooter />
    </>
  );
}
