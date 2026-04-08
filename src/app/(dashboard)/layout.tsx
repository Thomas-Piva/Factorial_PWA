export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/backend/get-user-context";
import { Sidebar, SidebarContent } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const ctx = await getUserContext(supabase);

  if (!ctx) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar profile={ctx.profile} displayName={ctx.displayName} />

      <div className="flex flex-1 flex-col lg:ml-[220px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 lg:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="lg:hidden" />
              }
            >
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[240px] p-0 sm:max-w-[240px]"
            >
              <SheetHeader className="border-b p-6 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-green-600">
                    <span className="text-xl font-bold leading-none text-white">
                      E
                    </span>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-800">
                    Erboristerie
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-80px)] flex-1">
                <SidebarContent
                  profile={ctx.profile}
                  displayName={ctx.displayName}
                  isMobile
                />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 font-semibold text-slate-800">
            Erboristerie
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
