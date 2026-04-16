import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, Award, Briefcase, CalendarDays } from "lucide-react";
import BasicProfilingTab from "./profile/BasicProfilingTab";
import EducationTab from "./profile/EducationTab";
import TrainingDevTab from "./profile/TrainingDevTab";
import EmploymentInfoTab from "./profile/EmploymentInfoTab";
import LeaveTab from "./profile/LeaveTab";

export default function E201Modal({ employee, open, onOpenChange, onToggleActive }) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 md:w-[90vw]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-bold">
            E201 — {employee.first_name} {employee.last_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {employee.employee_id || "Year-001"} · {employee.department} · {employee.position}
          </p>
        </DialogHeader>

        <Tabs defaultValue="profiling" className="px-6 pb-6 mt-4">
          <TabsList className="w-full justify-start bg-muted/50 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="profiling" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />
              Basic Profiling
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              Educational Record
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Award className="w-3.5 h-3.5" />
              Training & Development
            </TabsTrigger>
            <TabsTrigger value="employment" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
              Employment Info
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <CalendarDays className="w-3.5 h-3.5" />
              Leave Credits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiling" className="mt-4">
            <BasicProfilingTab employee={employee} onToggleActive={onToggleActive} isReadOnly={true} />
          </TabsContent>
          <TabsContent value="education" className="mt-4">
            <EducationTab employee={employee} isReadOnly={true} />
          </TabsContent>
          <TabsContent value="training" className="mt-4">
            <TrainingDevTab employee={employee} isReadOnly={true} />
          </TabsContent>
          <TabsContent value="employment" className="mt-4">
            <EmploymentInfoTab employee={employee} isReadOnly={true} />
          </TabsContent>
          <TabsContent value="leave" className="mt-4">
            <LeaveTab employee={employee} isReadOnly={true} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}