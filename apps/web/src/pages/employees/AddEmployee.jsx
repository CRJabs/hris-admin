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
import { sanitizeByFieldName, validateUniversityEmail } from "@/utils/inputValidation";

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
    const sanitized = sanitizeByFieldName(field, value);
    setEmployeeData(prev => ({ ...prev, [field]: sanitized }));
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

  const [inlineAccountError, setInlineAccountError] = useState("");

  const handleCreateAccount = async () => {
    setInlineAccountError("");
    if (!accountData.first_name?.trim() || !accountData.last_name?.trim() || !accountData.email?.trim() || !accountData.password) {
      setInlineAccountError("First name, last name, email, and password are required.");
      return;
    }

    if (!validateUniversityEmail(accountData.email)) {
      setInlineAccountError("Email must be in the format: [user]@universityofbohol.edu.ph");
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
    <div className="p-4 w-full h-full flex flex-col gap-4 animate-in fade-in duration-300">
      {step === 1 ? (
        <div className="py-12 px-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-8">
          <div className="flex flex-col items-center text-center gap-3">
            <img src="/assets/ub-hris-logo.png" alt="UB HRIS" className="h-16 object-contain" />
            <h3 className="text-5xl font-black text-slate-900 tracking-tight">Personnel Onboarding</h3>
          </div>

          <div className="w-full space-y-5 bg-white border border-slate-200 rounded-2xl p-8 shadow-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wider text-slate-700">First Name</Label>
                <Input 
                  id="first_name" 
                  placeholder="First Name" 
                  className="h-10 text-xs border-slate-200"
                  value={accountData.first_name}
                  onChange={(e) => setAccountData(prev => ({ ...prev, first_name: sanitizeByFieldName('first_name', e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="middle_name" className="text-xs font-bold uppercase tracking-wider text-slate-700">Middle Name</Label>
                <Input 
                  id="middle_name" 
                  placeholder="Middle Name" 
                  className="h-10 text-xs border-slate-200"
                  value={accountData.middle_name}
                  onChange={(e) => setAccountData(prev => ({ ...prev, middle_name: sanitizeByFieldName('middle_name', e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wider text-slate-700">Last Name</Label>
                <Input 
                  id="last_name" 
                  placeholder="Last Name" 
                  className="h-10 text-xs border-slate-200"
                  value={accountData.last_name}
                  onChange={(e) => setAccountData(prev => ({ ...prev, last_name: sanitizeByFieldName('last_name', e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="titles" className="text-xs font-bold uppercase tracking-wider text-slate-700">Titles / Honorifics</Label>
              <Input 
                id="titles" 
                placeholder="Titles (e.g. PhD, LPT)" 
                className="h-10 text-xs border-slate-200"
                value={accountData.titles}
                onChange={(e) => setAccountData(prev => ({ ...prev, titles: sanitizeByFieldName('titles', e.target.value) }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700">Login Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@universityofbohol.edu.ph" 
                    className="pl-9 h-10 text-xs border-slate-200"
                    value={accountData.email}
                    onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" title="Temporary Password" className="text-xs font-bold uppercase tracking-wider text-slate-700">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className="pl-9 pr-9 h-10 text-xs border-slate-200"
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
              </div>
            </div>

            {inlineAccountError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 flex items-start gap-3 text-left animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-700">{inlineAccountError}</p>
              </div>
            )}

            <p className="text-2xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Tip: Personnel will be prompted to change this password upon their first login.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => navigate("/employees")} disabled={isCreatingAccount} className="h-9 text-xs font-bold border-slate-200">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAccount} 
                disabled={isCreatingAccount}
                className="bg-[#0C005F] hover:bg-[#0C005F]/90 h-9 px-6 text-xs font-bold text-white shadow-none"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account & Proceed to Details"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top Info Banner Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {accountData.first_name} {accountData.last_name}{accountData.titles ? `, ${accountData.titles}` : ""}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {employeeData.employee_id || "ID Generating..."} • Personnel Onboarding Form
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/employees")} disabled={isSaving} className="h-8 text-xs font-bold border-slate-200">
                Cancel
              </Button>
              <Button onClick={handleSaveEmployee} disabled={isSaving} className="h-8 text-xs font-bold gap-2 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white px-6">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Personnel Profile
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profiling" className="w-full flex flex-col gap-4">
            <div className="px-6 py-2 bg-slate-50/50 border border-slate-200 rounded-xl">
              <TabsList className="w-full flex bg-slate-100/80 border border-slate-200 rounded-xl p-1 gap-1 h-auto shadow-none">
                <TabsTrigger value="profiling" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                  <User className="w-3.5 h-3.5" /> Personal Details
                </TabsTrigger>
                <TabsTrigger value="education" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Educational Record
                </TabsTrigger>
                <TabsTrigger value="training" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Trainings and Development
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex-1 justify-center py-2 text-xs font-bold rounded-lg text-slate-600 data-[state=active]:bg-[#0C005F] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Employment Info
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <TabsContent value="profiling" className="mt-0 focus-visible:ring-0">
                <PersonalDetailsTab 
                  employee={employeeData} 
                  onChange={handleFieldChange} 
                  isReadOnly={false} 
                  isEditMode={true} 
                  errors={errors}
                />
              </TabsContent>
              <TabsContent value="education" className="mt-0 focus-visible:ring-0">
                <EducationTab 
                  employee={employeeData} 
                  isEditing={true} 
                  onUpdate={(newData) => handleFieldChange('educational_record', newData)} 
                />
              </TabsContent>
              <TabsContent value="training" className="mt-0 focus-visible:ring-0">
                <TrainingDevTab 
                  employee={employeeData} 
                  isEditing={true} 
                  onUpdate={(field, newData) => handleFieldChange(field, newData)} 
                />
              </TabsContent>
              <TabsContent value="employment" className="mt-0 focus-visible:ring-0">
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
        </div>
      )}
    </div>
  );
}
