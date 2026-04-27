import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface FamilySectionProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGrid: (key: string, data: any[]) => void;
  emergencyCols: any[];
  childrenCols: any[];
}

export const FamilySection: React.FC<FamilySectionProps> = ({ formData, handleChange, handleGrid, emergencyCols, childrenCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1"><Label>Mobile No. *</Label><Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Email Address</Label><Input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} /></div>
          <div className="space-y-1 col-span-2"><Label>Complete Permanent Address</Label><Input name="address_street" value={formData.address_street} onChange={handleChange} placeholder="House No., Street, Subdivision" /></div>
          <div className="space-y-1"><Label>City/Municipality</Label><Input name="address_city" value={formData.address_city} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Province</Label><Input name="address_province" value={formData.address_province} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Country</Label><Input name="address_country" value={formData.address_country} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Zip Code</Label><Input name="address_zip" value={formData.address_zip} onChange={handleChange} /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Emergency Contact Line" columns={emergencyCols} data={formData.emergency_contacts} onChange={(d: any) => handleGrid('emergency_contacts', d)} />
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Spousal Details</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1 col-span-2"><Label>Spouse Name</Label><Input name="spouse_name" value={formData.spouse_name} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Gender</Label><Input name="spouse_gender" value={formData.spouse_gender} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Birth Date</Label><Input type="date" name="spouse_birthdate" value={formData.spouse_birthdate} onChange={handleChange} /></div>
          <div className="space-y-1 col-span-2"><Label>Employer</Label><Input name="spouse_employer" value={formData.spouse_employer} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Position/Job Title</Label><Input name="spouse_position" value={formData.spouse_position} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Employment Status</Label><Input name="spouse_employment_status" value={formData.spouse_employment_status} onChange={handleChange} /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Children Profiles" columns={childrenCols} data={formData.spouse_children} onChange={(d: any) => handleGrid('spouse_children', d)} />
      </div>
    </div>
  );
};
