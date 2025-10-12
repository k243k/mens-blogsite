import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminToastProvider } from "@/components/admin/AdminToastProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminToastProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminSidebar />
        <div className="flex w-full flex-col">
          <AdminHeader />
          <main className="flex-1 px-6 py-8">
            <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
