import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 overflow-auto">
        <div className="max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
