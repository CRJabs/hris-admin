import { Outlet } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function EmployeeLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-border sticky top-0 z-30 h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center shrink-0">
            <Building2 className="text-primary-foreground h-4 w-4" />
          </div>
          <h1 className="font-bold text-lg hidden sm:block">UBHRIS Employee Portal</h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
             <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
             <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
           </div>
           <Button variant="ghost" size="icon" onClick={logout} title="Log out">
             <LogOut className="h-5 w-5" />
           </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
