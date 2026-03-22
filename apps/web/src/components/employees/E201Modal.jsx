import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, Shield, Star, CalendarDays } from "lucide-react";
import BasicInfoTab from "./profile/BasicInfoTab";
import CompensationTab from "./profile/CompensationTab";
import ComplianceTab from "./profile/ComplianceTab";
import PerformanceTab from "./profile/PerformanceTab";
import TimeOffTab from "./profile/TimeOffTab";

export default function E201Modal({ employee, open, onOpenChange, onToggleActive }) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-bold">
            E201 — {employee.first_name} {employee.last_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {employee.employee_id} · {employee.department} · {employee.position}
          </p>
        </DialogHeader>

        <Tabs defaultValue="basic" className="px-6 pb-6">
          <TabsList className="w-full justify-start bg-muted/50 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="basic" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />
              Basic Info & Status
            </TabsTrigger>
            <TabsTrigger value="compensation" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <DollarSign className="w-3.5 h-3.5" />
              Compensation & Bonuses
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Compliance & Background
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Star className="w-3.5 h-3.5" />
              Performance & Records
            </TabsTrigger>
            <TabsTrigger value="timeoff" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <CalendarDays className="w-3.5 h-3.5" />
              Time Off
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <BasicInfoTab employee={employee} onToggleActive={onToggleActive} />
          </TabsContent>
          <TabsContent value="compensation" className="mt-4">
            <CompensationTab employee={employee} />
          </TabsContent>
          <TabsContent value="compliance" className="mt-4">
            <ComplianceTab employee={employee} />
          </TabsContent>
          <TabsContent value="performance" className="mt-4">
            <PerformanceTab employee={employee} />
          </TabsContent>
          <TabsContent value="timeoff" className="mt-4">
            <TimeOffTab employee={employee} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}