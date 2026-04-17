import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function EditProfileDialog({ employee }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: employee?.first_name || "",
    middle_name: employee?.middle_name || "",
    last_name: employee?.last_name || "",
    gender: employee?.gender || "",
    birthdate: employee?.birthdate || "",
    civil_status: employee?.civil_status || "",
    nationality: employee?.nationality || "Filipino",
    religion: employee?.religion || "",
    place_of_birth: employee?.place_of_birth || "",
    
    height: employee?.height || "",
    weight: employee?.weight || "",
    blood_type: employee?.blood_type || "",
    distinguishing_marks: employee?.distinguishing_marks || "",

    contact_phone: employee?.contact_phone || employee?.phone || "",
    contact_email: employee?.contact_email || employee?.email || "",
    address_street: employee?.address_street || "",
    address_barangay: employee?.address_barangay || "",
    address_city: employee?.address_city || "",
    address_province: employee?.address_province || "",
    address_country: employee?.address_country || "Philippines",
    address_zip: employee?.address_zip || "",

    father_name: employee?.father_name || "",
    father_occupation: employee?.father_occupation || "",
    mother_name: employee?.mother_name || "",
    mother_occupation: employee?.mother_occupation || "",
  });

  // Since employees.languages is JSONB:
  const [languages, setLanguages] = useState(employee?.languages || []);
  const [dependents, setDependents] = useState(employee?.dependents || []); // We assume an array of dependents or stored as JSONB if applicable 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addLanguage = () => setLanguages([...languages, { language: "", fluency: "Basic", skills: "" }]);
  const updateLanguage = (index, field, value) => {
    const updated = [...languages];
    updated[index][field] = value;
    setLanguages(updated);
  };
  const removeLanguage = (index) => setLanguages(languages.filter((_, i) => i !== index));

  const addDependent = () => setDependents([...dependents, { name: "", relation: "", birthdate: "", gender: "" }]);
  const updateDependent = (index, field, value) => {
    const updated = [...dependents];
    updated[index][field] = value;
    setDependents(updated);
  };
  const removeDependent = (index) => setDependents(dependents.filter((_, i) => i !== index));


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestedChanges = {};
      
      // Compare flat fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== (employee?.[key] || "")) {
          requestedChanges[key] = formData[key];
        }
      });

      // Compare array
      if (JSON.stringify(languages) !== JSON.stringify(employee?.languages || [])) {
        requestedChanges.languages = languages;
      }
      if (JSON.stringify(dependents) !== JSON.stringify(employee?.dependents || [])) {
        requestedChanges.dependents = dependents;
      }

      if (Object.keys(requestedChanges).length === 0) {
        toast({
          title: "No changes detected",
          description: "You haven't made any changes to your profile details.",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('employee_update_requests')
        .insert([{
          employee_id: employee.id,
          requested_changes: requestedChanges,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your profile update request has been sent to HR for approval.",
      });
      
      setOpen(false);

    } catch (error) {
      console.error("Error submitting profile update:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Pencil className="w-4 h-4" />
          Edit Personal Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Profile Details</DialogTitle>
          <DialogDescription>
            Submit changes to your comprehensive HR record.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
          <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden px-6">
            <TabsList className="w-full justify-start mt-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Family</TabsTrigger>
              <TabsTrigger value="arrays">Languages</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 mt-4 pr-4 pb-4">
              
              <TabsContent value="personal" className="space-y-4 m-0">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input name="first_name" value={formData.first_name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Middle Name</Label>
                    <Input name="middle_name" value={formData.middle_name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input name="last_name" value={formData.last_name} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Birthdate</Label>
                    <Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Input name="gender" value={formData.gender} onChange={handleChange} placeholder="Male / Female" />
                  </div>
                  <div className="space-y-2">
                    <Label>Civil Status</Label>
                    <Input name="civil_status" value={formData.civil_status} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input name="nationality" value={formData.nationality} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 170cm" />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 150lbs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Input name="blood_type" value={formData.blood_type} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Input name="religion" value={formData.religion} onChange={handleChange} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Label className="text-sm font-bold border-b pb-1">Permanent Address</Label>
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input name="address_street" value={formData.address_street} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Barangay</Label>
                      <Input name="address_barangay" value={formData.address_barangay} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>City / Municipality</Label>
                      <Input name="address_city" value={formData.address_city} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Province / State</Label>
                      <Input name="address_province" value={formData.address_province} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip Code</Label>
                      <Input name="address_zip" value={formData.address_zip} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                   <Label className="text-sm font-bold border-b pb-1">Parents Information</Label>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Father's Name</Label>
                       <Input name="father_name" value={formData.father_name} onChange={handleChange} />
                     </div>
                     <div className="space-y-2">
                       <Label>Mother's Maiden Name</Label>
                       <Input name="mother_name" value={formData.mother_name} onChange={handleChange} />
                     </div>
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="arrays" className="space-y-8 m-0">
                 {/* Dependents */}
                 <div className="space-y-4">
                   <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                     <Label className="font-bold">Dependent's Information</Label>
                     <Button type="button" variant="outline" size="sm" onClick={addDependent}>
                       <Plus className="w-4 h-4 mr-1" /> Add Dependent
                     </Button>
                   </div>
                   
                   {dependents.map((dep, index) => (
                     <div key={index} className="grid grid-cols-12 gap-2 items-end border bg-muted/10 p-3 rounded-md">
                       <div className="col-span-4 space-y-1">
                         <Label className="text-xs">Name</Label>
                         <Input value={dep.name} onChange={(e) => updateDependent(index, 'name', e.target.value)} />
                       </div>
                       <div className="col-span-3 space-y-1">
                         <Label className="text-xs">Relation</Label>
                         <Input value={dep.relation} onChange={(e) => updateDependent(index, 'relation', e.target.value)} />
                       </div>
                       <div className="col-span-2 space-y-1">
                         <Label className="text-xs">Gender</Label>
                         <Input value={dep.gender} onChange={(e) => updateDependent(index, 'gender', e.target.value)} />
                       </div>
                       <div className="col-span-2 space-y-1">
                         <Label className="text-xs">Birthdate</Label>
                         <Input type="date" value={dep.birthdate} onChange={(e) => updateDependent(index, 'birthdate', e.target.value)} />
                       </div>
                       <div className="col-span-1 pb-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeDependent(index)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                     </div>
                   ))}
                   {dependents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No dependents added yet.</p>}
                 </div>

                 {/* Languages */}
                 <div className="space-y-4">
                   <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border-t pt-4">
                     <Label className="font-bold">Languages Spoken</Label>
                     <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                       <Plus className="w-4 h-4 mr-1" /> Add Language
                     </Button>
                   </div>
                   
                   {languages.map((lang, index) => (
                     <div key={index} className="grid grid-cols-12 gap-2 items-end border bg-muted/10 p-3 rounded-md">
                       <div className="col-span-4 space-y-1">
                         <Label className="text-xs">Language</Label>
                         <Input value={lang.language} onChange={(e) => updateLanguage(index, 'language', e.target.value)} placeholder="e.g. English" />
                       </div>
                       <div className="col-span-3 space-y-1">
                         <Label className="text-xs">Fluency</Label>
                         <Input value={lang.fluency} onChange={(e) => updateLanguage(index, 'fluency', e.target.value)} placeholder="Fluent" />
                       </div>
                       <div className="col-span-4 space-y-1">
                         <Label className="text-xs">Skills</Label>
                         <Input value={lang.skills} onChange={(e) => updateLanguage(index, 'skills', e.target.value)} placeholder="Read, Write" />
                       </div>
                       <div className="col-span-1 pb-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLanguage(index)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                     </div>
                   ))}
                   {languages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No languages added yet.</p>}
                 </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="p-6 pt-4 bg-muted/5 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
