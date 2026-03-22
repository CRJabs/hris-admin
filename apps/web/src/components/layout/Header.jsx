import { useState } from "react";
import { Search, Bell, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const notifications = [
  { id: 1, title: "License Expiring", message: "Carlo Reyes — PRC IE license expires Dec 31, 2025", type: "warning", time: "2 hours ago" },
  { id: 2, title: "Probation Review Due", message: "Ana Garcia — 6-month review due on Jul 6, 2025", type: "info", time: "5 hours ago" },
  { id: 3, title: "Regularization Due", message: "Rafael Aquino — regularization date approaching Aug 1, 2025", type: "info", time: "1 day ago" },
  { id: 4, title: "Birthday Reminder", message: "Juan Dela Cruz — birthday on Mar 15", type: "success", time: "2 days ago" },
  { id: 5, title: "Contract Ending", message: "Roberto Villanueva — 6-month contract ends Sep 1, 2025", type: "warning", time: "3 days ago" },
];

export default function Header({ onSearch }) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees, departments..."
          value={searchValue}
          onChange={handleSearch}
          className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
        {searchValue && (
          <button onClick={() => { setSearchValue(""); onSearch?.(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <Upload className="w-3.5 h-3.5" />
          Import Data (.csv)
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{notifications.length} new alerts</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.type === "warning" ? "bg-amber-500" : n.type === "success" ? "bg-green-500" : "bg-primary"
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-semibold">LM</span>
        </div>
      </div>
    </header>
  );
}