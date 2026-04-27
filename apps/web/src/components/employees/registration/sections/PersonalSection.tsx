import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface PersonalDataProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelect: (name: string, value: string) => void;
  handleGrid: (key: string, data: any[]) => void;
  langCols: any[];
}

export const PersonalSection: React.FC<PersonalDataProps> = ({ formData, handleChange, handleSelect, handleGrid, langCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Personal Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1 md:col-span-1"><Label>Given Name *</Label><Input name="first_name" value={formData.first_name} onChange={handleChange} /></div>
          <div className="space-y-1 md:col-span-1"><Label>Middle Name</Label><Input name="middle_name" value={formData.middle_name} onChange={handleChange} /></div>
          <div className="space-y-1 md:col-span-1"><Label>Family Name / Surname *</Label><Input name="last_name" value={formData.last_name} onChange={handleChange} /></div>
          <div className="space-y-1 md:col-span-1"><Label>Titles / Post-Nominals</Label><Input name="titles" value={formData.titles} onChange={handleChange} placeholder="e.g. PhD, LPT" /></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select value={formData.gender} onValueChange={(val) => handleSelect("gender", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Civil Status</Label>
            <Select value={formData.civil_status} onValueChange={(val) => handleSelect("civil_status", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Widow/Widower">Widow/Widower</SelectItem>
                <SelectItem value="Separated/Divorced">Separated/Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1"><Label>Birth Date *</Label><Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Place of Birth</Label><Input name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Age</Label><Input type="number" name="age" value={formData.age} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Nationality</Label><Input name="nationality" value={formData.nationality} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Religion</Label><Input name="religion" value={formData.religion} onChange={handleChange} /></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="space-y-1"><Label>Height (cms)</Label><Input name="height" value={formData.height} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Weight (lbs)</Label><Input name="weight" value={formData.weight} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Blood Type</Label><Input name="blood_type" value={formData.blood_type} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Distinguishing Marks</Label><Input name="distinguishing_marks" value={formData.distinguishing_marks} onChange={handleChange} /></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Parents Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1"><Label>Father's Full Name</Label><Input name="father_name" value={formData.father_name} onChange={handleChange} /></div>
            <div className="flex items-center gap-6 px-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox 
                  checked={formData.father_status === "Living"} 
                  onCheckedChange={(checked) => handleSelect('father_status', checked ? 'Living' : 'Deceased')}
                />
                Living
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox 
                  checked={formData.father_status === "Deceased"} 
                  onCheckedChange={(checked) => handleSelect('father_status', checked ? 'Deceased' : 'Living')}
                />
                Deceased
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1"><Label>Mother's Maiden Name</Label><Input name="mother_maiden_name" value={formData.mother_maiden_name} onChange={handleChange} /></div>
            <div className="flex items-center gap-6 px-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox 
                  checked={formData.mother_status === "Living"} 
                  onCheckedChange={(checked) => handleSelect('mother_status', checked ? 'Living' : 'Deceased')}
                />
                Living
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox 
                  checked={formData.mother_status === "Deceased"} 
                  onCheckedChange={(checked) => handleSelect('mother_status', checked ? 'Deceased' : 'Living')}
                />
                Deceased
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid 
          title="Languages & Literacy" 
          columns={langCols} 
          data={formData.languages || []} 
          onChange={(d: any) => handleGrid('languages', d)} 
        />
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Government ID's</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1"><Label>SSS No.</Label><Input name="sss" value={formData.sss} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>TIN No.</Label><Input name="tin" value={formData.tin} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Philhealth No.</Label><Input name="philhealth" value={formData.philhealth} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>PAG-IBIG No.</Label><Input name="pag_ibig" value={formData.pag_ibig} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>PERAA (Teaching Staff)</Label><Input name="peraa" value={formData.peraa} onChange={handleChange} /></div>
          <div className="space-y-1">
            <Label>Tax Status</Label>
            <Select value={formData.tax_status} onValueChange={(val) => handleSelect("tax_status", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Head of the Family">Head of the Family</SelectItem>
                <SelectItem value="Zero">Zero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
