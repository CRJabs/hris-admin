import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function EmployeeLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img
            src="/assets/ub-hris-logo.png"
            alt="University of Bohol HRIS Logo"
            className="h-10 object-contain"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/150x40?text=Logo+Placeholder";
            }}
          />
        </div>
        
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={logout} title="Log out">
             <LogOut className="h-5 w-5" />
           </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
