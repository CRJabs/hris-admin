import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  User, GraduationCap, Award, Briefcase, CalendarDays, 
  ShieldCheck, Save, Check, X, Loader2, Mail, Lock, UserPlus 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PersonalDetailsTab from "./profile/PersonalDetailsTab";
import EducationTab from "./profile/EducationTab";
import TrainingDevTab from "./profile/TrainingDevTab";
import EmploymentInfoTab from "./profile/EmploymentInfoTab";
import LeaveTab from "./profile/LeaveTab";
import CredentialsTab from "./profile/CredentialsTab";
import SkillsTab from "./profile/SkillsTab";

const defaultEmployee = {
  first_name: "", middle_name: "", last_name: "", titles: "", gender: "Male", birthdate: "",
  place_of_birth: "", civil_status: "Single", nationality: "Filipino", religion: "", age: "",
  address_street: "", address_barangay: "", address_city: "", address_province: "", address_zip: "", address_country: "Philippines",
  contact_phone: "", contact_email: "",
  sss: "", tin: "", philhealth: "", pag_ibig: "", peraa: "", tax_status: "Single",
  height: "", weight: "", blood_type: "", distinguishing_marks: "",
  educational_record: [],
  internal_trainings: [],
  external_trainings: [],
  previous_employment: [],
  awards_citations: [],
  scholarships_research: [],
  licenses: [],
  exams_taken: [],
  skills: [],
  group_affiliations: [],
  extra_activities: [],
  languages: [],
  spouse_name: "", spouse_gender: "Female", spouse_birthdate: "", spouse_age: "",
  spouse_employer: "", spouse_position: "", spouse_employment_status: "",
  spouse_children: [],
  emergency_contacts: [],
  department: "Human Resources",
  position: "Employee",
  employment_status: "Regular",
  employment_classification: "Non-Teaching",
  is_active: true
};

export default function AddEmployeeModal({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Info, 2: Account
  const [employeeData, setEmployeeData] = useState(defaultEmployee);
  const [isSaving, setIsSaving] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Account State
  const [accountData, setAccountData] = useState({ email: "", password: "" });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (open) {
      setEmployeeData(defaultEmployee);
      setStep(1);
      setCreatedEmployee(null);
      setAccountData({ email: "", password: "" });
      setErrors({});
    }
  }, [open]);

  const handleFieldChange = (field, value) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!employeeData.first_name?.trim()) newErrors.first_name = "First name is required";
    if (!employeeData.last_name?.trim()) newErrors.last_name = "Last name is required";
    if (!employeeData.birthdate) newErrors.birthdate = "Birth date is required";
    if (!employeeData.contact_email?.trim()) newErrors.contact_email = "Email is required";
    if (!employeeData.contact_phone?.trim()) newErrors.contact_phone = "Phone number is required";
    if (!employeeData.department) newErrors.department = "Department is required";
    
    setErrors(newErrors);
    console.log("Validation complete. Errors:", newErrors);
    return newErrors;
  };

  const handleSaveEmployee = async () => {
    console.log("Save button clicked. Current data:", employeeData);
    
    const validationErrors = validateForm();
    const errorCount = Object.keys(validationErrors).length;
    
    if (errorCount > 0) {
      console.warn("Validation failed:", validationErrors);
      toast.error(`Validation Failed: ${errorCount} field(s) missing`, {
        description: `Please fill in: ${Object.values(validationErrors).join(", ")}`,
        duration: 5000,
      });
      return;
    }

    setIsSaving(true);
    console.log("Starting Supabase insert...");
    try {
      // Generate ID logic
      const year = new Date().getFullYear();
      console.log("Fetching employee count for year:", year);
      const { count, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .filter('employee_id', 'ilike', `${year} - %`);
      
      if (countError) {
        console.error("Count fetch error:", countError);
        throw countError;
      }
      
      const nextIdNumber = (count || 0) + 1;
      const generatedId = `${year} - ${String(nextIdNumber).padStart(3, '0')}`;
      console.log("Generated Employee ID:", generatedId);

      // Postgres/Supabase strict typing fix: convert empty strings to null
      // This matches the logic in EmployeeRegistration.jsx
      const sanitizedData = Object.fromEntries(
        Object.entries(employeeData).map(([key, value]) => [
          key, 
          (value === "" || (typeof value === "string" && value.trim() === "")) ? null : value
        ])
      );

      console.log("Sanitized data for insert:", sanitizedData);

      const { data, error } = await supabase
        .from('employees')
        .insert([{ 
          ...sanitizedData, 
          employee_id: generatedId,
          // Explicitly set user_id to null as it will be linked in Step 2
          user_id: null 
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error.message, error.details, error.hint);
        throw new Error(error.message || "Failed to insert employee record");
      }

      console.log("Employee created successfully:", data);
      setCreatedEmployee(data);
      // Auto-fill account email with the one provided in personal details
      setAccountData(prev => ({ ...prev, email: data.contact_email || "" }));
      toast.success("Employee record created successfully. Proceed to account assignment.");
      setStep(2); // MOVE TO ACCOUNT ASSIGNMENT STEP
    } catch (err) {
      console.error("Critical Save error:", err);
      toast.error("Critical Error", {
        description: err.message || "An unexpected error occurred while saving. Please check your connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!accountData.email || !accountData.password) {
      toast.error("Email and password are required.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch("/api/create-auth-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: accountData.email,
          password: accountData.password,
          employeeId: createdEmployee.employee_id
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create account");

      // Link the new user_id to the employee record
      const { error: linkError } = await supabase
        .from('employees')
        .update({ user_id: result.user.id })
        .eq('id', createdEmployee.id);

      if (linkError) throw linkError;

      toast.success("Account assigned and linked successfully.");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 xl:max-w-7xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {step === 1 ? "Manually Add New Employee" : "Assign Employee Account"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Fill in the employee's personal and professional details." 
              : `Create login credentials for ${createdEmployee?.first_name} ${createdEmployee?.last_name}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex flex-col h-full max-h-[75vh]">
            <Tabs defaultValue="profiling" className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 border-b">
                <TabsList className="w-full justify-start bg-transparent h-auto flex-wrap gap-1 p-0 mb-2">
                  <TabsTrigger value="profiling" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <User className="w-3.5 h-3.5" /> Personal Details
                  </TabsTrigger>
                  <TabsTrigger value="education" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <GraduationCap className="w-3.5 h-3.5" /> Education
                  </TabsTrigger>
                  <TabsTrigger value="training" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <Award className="w-3.5 h-3.5" /> Training
                  </TabsTrigger>
                  <TabsTrigger value="employment" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <Briefcase className="w-3.5 h-3.5" /> Employment
                  </TabsTrigger>
                  <TabsTrigger value="credentials" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <ShieldCheck className="w-3.5 h-3.5" /> Credentials
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                <TabsContent value="profiling" className="m-0 focus-visible:ring-0">
                  <PersonalDetailsTab 
                    employee={employeeData} 
                    onChange={handleFieldChange} 
                    isReadOnly={false} 
                    isEditMode={true} 
                    errors={errors}
                  />
                </TabsContent>
                <TabsContent value="education" className="m-0 focus-visible:ring-0">
                  <EducationTab 
                    employee={employeeData} 
                    isEditing={true} 
                    onUpdate={(newData) => handleFieldChange('educational_record', newData)} 
                  />
                </TabsContent>
                <TabsContent value="training" className="m-0 focus-visible:ring-0">
                  <TrainingDevTab 
                    employee={employeeData} 
                    isEditing={true} 
                    onUpdate={(field, newData) => handleFieldChange(field, newData)} 
                  />
                </TabsContent>
                <TabsContent value="employment" className="m-0 focus-visible:ring-0">
                  <EmploymentInfoTab 
                    employee={employeeData} 
                    onChange={handleFieldChange} 
                    isReadOnly={false} 
                    errors={errors}
                  />
                </TabsContent>
                <TabsContent value="credentials" className="m-0 focus-visible:ring-0">
                  <div className="grid grid-cols-1 gap-6">
                    <CredentialsTab 
                      employee={employeeData} 
                      isEditing={true} 
                      onUpdate={(field, newData) => handleFieldChange(field, newData)} 
                    />
                    <SkillsTab 
                      employee={employeeData} 
                      isEditing={true} 
                      onUpdate={(field, newData) => handleFieldChange(field, newData)} 
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 rounded-b-lg">
               <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
               <Button onClick={handleSaveEmployee} disabled={isSaving} className="gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90 min-w-[200px]">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save & Next: Account
               </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center max-w-md mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
               <Mail className="w-10 h-10 text-primary" />
            </div>
            
            <div className="text-center">
               <h3 className="text-lg font-bold">Profile Account Credentials</h3>
               <p className="text-sm text-muted-foreground mt-1">Set up the login details for this employee.</p>
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Login Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@university.edu.ph" 
                    className="pl-10"
                    value={accountData.email}
                    onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={accountData.password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">Employees are advised to change this upon first login.</p>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3 pt-4">
               <Button 
                 onClick={handleCreateAccount} 
                 disabled={isCreatingAccount}
                 className="w-full bg-[#0C005F] hover:bg-[#0C005F]/90 h-11 font-bold shadow-lg"
               >
                 {isCreatingAccount ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Creating Account...
                   </>
                 ) : (
                   "Complete & Assign Account"
                 )}
               </Button>
               <Button 
                 variant="ghost" 
                 onClick={() => onOpenChange(false)}
                 className="text-muted-foreground"
               >
                 Skip for now
               </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
