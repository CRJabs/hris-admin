import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  User, GraduationCap, Award, Briefcase, 
  Save, Loader2, Mail, Lock, Eye, EyeOff
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
  employee_id: "",
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
  employment_status: "Fulltime",
  employment_tenure: "Probationary",
  employment_classification: "Non-Teaching",
  classification_ii: "Academic Official",
  classification_iii: "New",
  is_active: true
};

export default function AddEmployee() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Account Creation, 2: Personnel Details
  const [employeeData, setEmployeeData] = useState(defaultEmployee);
  const [isSaving, setIsSaving] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Account State
  const [accountData, setAccountData] = useState({ first_name: "", middle_name: "", last_name: "", titles: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    const generateNextId = async () => {
      try {
        const year = new Date().getFullYear();
        const { data: lastEmp, error: lastEmpError } = await supabase
          .from('employees')
          .select('employee_id')
          .ilike('employee_id', `${year} - %`)
          .order('employee_id', { ascending: false })
          .limit(1);
        
        if (lastEmpError) throw lastEmpError;
        
        let nextIdNumber = 1;
        if (lastEmp && lastEmp.length > 0) {
          const lastId = lastEmp[0].employee_id;
          const parts = lastId.split(' - ');
          if (parts.length === 2) {
            nextIdNumber = parseInt(parts[1], 10) + 1;
          }
        }
        const generatedId = `${year} - ${String(nextIdNumber).padStart(3, '0')}`;
        setEmployeeData(prev => ({ ...prev, employee_id: generatedId }));
      } catch (err) {
        console.error("Error generating next ID:", err);
      }
    };
    generateNextId();
  }, []);

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

  const handleCreateAccount = async () => {
    if (!accountData.first_name?.trim() || !accountData.last_name?.trim() || !accountData.email?.trim() || !accountData.password) {
      toast.error("First name, last name, email, and password are required.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const year = new Date().getFullYear();
      const generatedId = employeeData.employee_id || `${year} - 001`;

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          email: accountData.email.trim(),
          password: accountData.password,
          employeeId: generatedId,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Account creation failed');
      }

      // Create initial employee record linked to the user account (do not pass middle_name or titles here)
      const { data: empRecord, error: empError } = await supabase
        .from('employees')
        .insert([{ 
          first_name: accountData.first_name.trim(),
          last_name: accountData.last_name.trim(),
          employee_id: generatedId,
          user_id: result.user.id,
          contact_email: accountData.email.trim(),
          department: employeeData.department,
          position: employeeData.position,
          employment_status: employeeData.employment_status,
          employment_tenure: employeeData.employment_tenure,
          employment_classification: employeeData.employment_classification,
          classification_ii: employeeData.classification_ii,
          classification_iii: employeeData.classification_iii,
          is_active: true
        }])
        .select()
        .single();

      if (empError) throw empError;

      setCreatedEmployee(empRecord);
      setEmployeeData(prev => ({
        ...prev,
        first_name: accountData.first_name.trim(),
        middle_name: accountData.middle_name.trim(),
        last_name: accountData.last_name.trim(),
        titles: accountData.titles.trim(),
        employee_id: generatedId,
        contact_email: accountData.email.trim()
      }));

      toast.success("Account created successfully. Now enter personnel information.");
      setStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to create account.");
    } finally {
      setIsCreatingAccount(false);
    }
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

    if (!createdEmployee?.id) {
      toast.error("Employee record error. Please recreate account first.");
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedData = Object.fromEntries(
        Object.entries(employeeData)
          .filter(([key]) => !['photo_file', 'signature_file', 'photo_url', 'signature_url'].includes(key))
          .map(([key, value]) => [
            key, 
            (value === "" || (typeof value === "string" && value.trim() === "")) ? null : value
          ])
      );

      const { data, error } = await supabase
        .from('employees')
        .update(sanitizedData)
        .eq('id', createdEmployee.id)
        .select()
        .single();

      if (error) throw error;

      // --- Handle File Uploads (Photo & Signature) ---
      let photoUrl = null;
      let signatureUrl = null;

      if (employeeData.photo_file) {
        const fileExt = employeeData.photo_file.name.split('.').pop();
        const filePath = `profiles/${data.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, employeeData.photo_file, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          photoUrl = publicUrl;
        }
      }

      if (employeeData.signature_file) {
        const fileExt = employeeData.signature_file.name.split('.').pop();
        const filePath = `signatures/${data.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, employeeData.signature_file, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          signatureUrl = publicUrl;
        }
      }

      if (photoUrl || signatureUrl) {
        await supabase.from('employees').update({
          ...(photoUrl && { photo_url: photoUrl }),
          ...(signatureUrl && { signature_url: signatureUrl })
        }).eq('id', data.id);
      }

      // Log to admin activity
      await supabase.from('admin_activity_log').insert({
        actor_type: 'admin',
        actor_name: 'Administrator',
        action: 'admin_added_employee',
        description: `Manually added new employee ${data.first_name} ${data.last_name}`,
        employee_id: data.id
      });

      // Automatically compute initial benefits eligibility for the new employee
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/run-benefits-computation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ employee_id: data.id, year: new Date().getFullYear() }),
        });
      } catch (e) {
        console.warn('Initial benefits calculation failed:', e);
      }

      toast.success("Employee profile saved successfully.");
      navigate("/employees");
    } catch (err) {
      console.error("Critical Save error:", err);
      toast.error("Critical Error", {
        description: err.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {step === 1 ? (
          <div className="p-16 flex flex-col items-center justify-center max-w-lg mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
               <Mail className="w-12 h-12 text-primary" />
            </div>
            
            <div className="text-center space-y-2">
               <h3 className="text-2xl font-bold">Create Employee Credentials</h3>
               <p className="text-muted-foreground">Set up the login details before entering employee personnel details.</p>
            </div>

            <div className="w-full space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-semibold">First Name</Label>
                  <Input 
                    id="first_name" 
                    placeholder="First Name" 
                    className="h-11 text-sm"
                    value={accountData.first_name}
                    onChange={(e) => setAccountData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name" className="text-sm font-semibold">Middle Name</Label>
                  <Input 
                    id="middle_name" 
                    placeholder="Middle Name" 
                    className="h-11 text-sm"
                    value={accountData.middle_name}
                    onChange={(e) => setAccountData(prev => ({ ...prev, middle_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-semibold">Last Name</Label>
                  <Input 
                    id="last_name" 
                    placeholder="Last Name" 
                    className="h-11 text-sm"
                    value={accountData.last_name}
                    onChange={(e) => setAccountData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titles" className="text-sm font-semibold">Titles / Honorifics</Label>
                <Input 
                  id="titles" 
                  placeholder="Titles (e.g. PhD, LPT)" 
                  className="h-11 text-sm"
                  value={accountData.titles}
                  onChange={(e) => setAccountData(prev => ({ ...prev, titles: e.target.value }))}
                />
              </div>

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
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className="pl-10 pr-10 h-11"
                    value={accountData.password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground italic bg-slate-50 p-2 rounded border border-slate-100">
                  Tip: Employees will be prompted to change this password upon their first login.
                </p>
              </div>
            </div>

            <div className="flex flex-col w-full gap-4 pt-6">
               <Button 
                 onClick={handleCreateAccount} 
                 disabled={isCreatingAccount}
                 className="w-full bg-[#0C005F] hover:bg-[#0C005F]/90 h-12 text-base font-bold shadow-lg"
               >
                 {isCreatingAccount ? (
                   <>
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                     Creating Account...
                   </>
                 ) : (
                   "Create Account & Proceed to Details"
                 )}
               </Button>
               <Button variant="outline" onClick={() => navigate("/employees")} disabled={isCreatingAccount}>
                 Cancel
               </Button>
            </div>
          </div>
        ) : (
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
                    isAdminView={true}
                    errors={errors}
                  />
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
               <Button variant="outline" onClick={() => navigate("/employees")} disabled={isSaving}>Cancel</Button>
               <Button onClick={handleSaveEmployee} disabled={isSaving} className="gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90 px-8">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Employee Profile
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
