import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, Award, Briefcase, CalendarDays, AlertCircle } from "lucide-react";
import BasicProfilingTab from "@/components/employees/profile/BasicProfilingTab";
import EducationTab from "@/components/employees/profile/EducationTab";
import TrainingDevTab from "@/components/employees/profile/TrainingDevTab";
import EmploymentInfoTab from "@/components/employees/profile/EmploymentInfoTab";
import LeaveTab from "@/components/employees/profile/LeaveTab";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        setEmployeeData(data);
      } catch (err) {
        console.error("Error loading employee profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your profile...</div>;
  }

  if (!employeeData) {
    // Fallback if data is missing
    return (
      <Card className="border-red-200 bg-red-50 text-red-800">
        <CardContent className="p-6 flex items-center gap-3">
           <AlertCircle className="w-5 h-5" />
           <p>Your employee profile could not be loaded. Please contact HR.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Personal E201 Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">View and request updates to your employee information.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <Tabs defaultValue="profiling" className="p-6">
          <TabsList className="w-full justify-start bg-muted/50 h-auto flex-wrap gap-1 p-1 mb-6">
            <TabsTrigger value="profiling" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />
              Basic Profiling
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              Educational Record
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Award className="w-3.5 h-3.5" />
              Training & Development
            </TabsTrigger>
            <TabsTrigger value="employment" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
              Employment Info
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CalendarDays className="w-3.5 h-3.5" />
              Leave Credits
            </TabsTrigger>
          </TabsList>

          {/* isReadOnly is false here so they can request edits. The actual saving logic would be wired to the buttons in the tabs to insert into profile_update_requests */}
          <TabsContent value="profiling">
            <BasicProfilingTab employee={employeeData} onToggleActive={() => {}} isReadOnly={false} />
          </TabsContent>
          <TabsContent value="education">
            <EducationTab employee={employeeData} isReadOnly={false} />
          </TabsContent>
          <TabsContent value="training">
            <TrainingDevTab employee={employeeData} isReadOnly={false} />
          </TabsContent>
          <TabsContent value="employment">
            <EmploymentInfoTab employee={employeeData} isReadOnly={false} />
          </TabsContent>
          <TabsContent value="leave">
            <LeaveTab employee={employeeData} isReadOnly={false} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
