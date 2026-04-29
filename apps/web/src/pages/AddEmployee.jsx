import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  User, GraduationCap, Award, Briefcase, CalendarDays, 
  ShieldCheck, Save, Check, X, Loader2, Mail, Lock, UserPlus,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import PersonalDetailsTab from "@/components/employees/profile/PersonalDetailsTab";
import EducationTab from "@/components/employees/profile/EducationTab";
import TrainingDevTab from "@/components/employees/profile/TrainingDevTab";
import EmploymentInfoTab from "@/components/employees/profile/EmploymentInfoTab";

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

export default function AddEmployee() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Info, 2: Account
  const [employeeData, setEmployeeData] = useState(defaultEmployee);
  const [isSaving, setIsSaving] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Account State
  const [accountData, setAccountData] = useState({ email: "", password: "" });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

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
    return newErrors;
  };

  const handleSaveEmployee = async () => {
    const validationErrors = validateForm();
    const errorCount = Object.keys(validationErrors).length;
    
    if (errorCount > 0) {
      toast.error(`Validation Failed: ${errorCount} field(s) missing`, {
        description: `Please fill in: ${Object.values(validationErrors).join(", ")}`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const year = new Date().getFullYear();
      const { count, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .filter('employee_id', 'ilike', `${year} - %`);
      
      if (countError) throw countError;
      
      const nextIdNumber = (count || 0) + 1;
      const generatedId = `${year} - ${String(nextIdNumber).padStart(3, '0')}`;

      const sanitizedData = Object.fromEntries(
        Object.entries(employeeData).map(([key, value]) => [
          key, 
          (value === "" || (typeof value === "string" && value.trim() === "")) ? null : value
        ])
      );

      const { data, error } = await supabase
        .from('employees')
        .insert([{ 
          ...sanitizedData, 
          employee_id: generatedId,
          user_id: null 
        }])
        .select()
        .single();

      if (error) throw new Error(error.message || "Failed to insert employee record");

      setCreatedEmployee(data);
      setAccountData(prev => ({ ...prev, email: data.contact_email || "" }));

      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_added_employee',
        description: `Manually added new employee ${data.first_name} ${data.last_name}`,
        employee_id: data.id
      });

      toast.success("Employee record created successfully. Proceed to account assignment.");
      setStep(2);
    } catch (err) {
      console.error("Critical Save error:", err);
      toast.error("Critical Error", {
        description: err.message || "An unexpected error occurred while saving.",
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

      const { error: linkError } = await supabase
        .from('employees')
        .update({ user_id: result.user.id })
        .eq('id', createdEmployee.id);

      if (linkError) throw linkError;

      toast.success("Account assigned and linked successfully.");
      navigate("/employees");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-primary" />
              {step === 1 ? "Onboard new Employee" : "Assign Employee Account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 
                ? "Fill in the employee's personal and professional details." 
                : `Create login credentials for ${createdEmployee?.first_name} ${createdEmployee?.last_name}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {step === 1 ? (
          <div className="flex flex-col">
            <Tabs defaultValue="profiling" className="w-full">
              <div className="px-6 border-b bg-slate-50/50">
                <TabsList className="w-full justify-start bg-transparent h-auto flex-wrap gap-1 p-0 py-2">
                  <TabsTrigger value="profiling" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <User className="w-4 h-4" /> Personal Details
                  </TabsTrigger>
                  <TabsTrigger value="education" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <GraduationCap className="w-4 h-4" /> Education
                  </TabsTrigger>
                  <TabsTrigger value="training" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Award className="w-4 h-4" /> Trainings and Development
                  </TabsTrigger>
                  <TabsTrigger value="employment" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Briefcase className="w-4 h-4" /> Employment
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
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
              </div>
            </Tabs>
            
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
               <Button variant="outline" onClick={() => navigate("/employees")} disabled={isSaving}>Cancel</Button>
               <Button onClick={handleSaveEmployee} disabled={isSaving} className="gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90 px-8">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save & Next: Account
               </Button>
            </div>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
               <Mail className="w-12 h-12 text-primary" />
            </div>
            
            <div className="text-center space-y-2">
               <h3 className="text-2xl font-bold">Profile Account Credentials</h3>
               <p className="text-muted-foreground">Set up the login details for this employee.</p>
            </div>

            <div className="w-full space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Login Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@university.edu.ph" 
                    className="pl-10 h-11"
                    value={accountData.email}
                    onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="Temporary Password" className="text-sm font-semibold">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-11"
                    value={accountData.password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground italic bg-slate-50 p-2 rounded border border-slate-100">
                  Tip: Employees are advised to change this upon first login for security.
                </p>
              </div>
            </div>

            <div className="flex flex-col w-full gap-4 pt-6">
               <Button 
                 onClick={handleCreateAccount} 
                 disabled={isCreatingAccount}
                 className="w-full bg-[#0C005F] hover:bg-[#0C005F]/90 h-12 text-lg font-bold shadow-lg"
               >
                 {isCreatingAccount ? (
                   <>
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                     Creating Account...
                   </>
                 ) : (
                   "Complete & Assign Account"
                 )}
               </Button>
               <Button 
                 variant="ghost" 
                 onClick={() => navigate("/employees")}
                 className="text-muted-foreground hover:bg-transparent hover:text-foreground"
               >
                 Skip for now and return to list
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
