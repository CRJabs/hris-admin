import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

export const FamilySection = ({ formData, handleChange, handleGrid, emergencyCols, childrenCols }) => {
  const [showSpouse, setShowSpouse] = React.useState(!!formData.spouse_name || !!formData.spouse_employer);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1"><Label>Mobile No. <span className="text-red-500">*</span></Label><Input name="contact_phone" inputMode="tel" value={formData.contact_phone} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Email Address</Label><Input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="username@universityofbohol.edu.ph" /></div>
          <div className="space-y-1 col-span-2"><Label>Complete Permanent Address</Label><Input name="address_street" value={formData.address_street} onChange={handleChange} placeholder="House No., Street, Subdivision" /></div>
          <div className="space-y-1"><Label>City/Municipality</Label><Input name="address_city" value={formData.address_city} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Province</Label><Input name="address_province" value={formData.address_province} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Country</Label><Input name="address_country" value={formData.address_country} onChange={handleChange} /></div>
          <div className="space-y-1"><Label>Zip Code</Label><Input name="address_zip" inputMode="numeric" value={formData.address_zip} onChange={handleChange} /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Emergency Contact Line" columns={emergencyCols} data={formData.emergency_contacts} onChange={(d) => handleGrid('emergency_contacts', d)} />
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b pb-2">
          <h2 className="text-xl font-bold text-slate-800">Spousal Details</h2>
          {!showSpouse ? (
            <Button 
              type="button" 
              size="sm" 
              onClick={() => setShowSpouse(true)}
              className="gap-1 h-8 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs rounded-[6px] shadow-none px-3 border-none flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spouse
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSpouse(false)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
        
        {showSpouse ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1 md:col-span-2"><Label>Spouse Name</Label><Input name="spouse_name" value={formData.spouse_name} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Gender</Label><Input name="spouse_gender" value={formData.spouse_gender} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Birth Date</Label><Input type="date" name="spouse_birthdate" value={formData.spouse_birthdate} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Age</Label><Input type="text" inputMode="numeric" name="spouse_age" value={formData.spouse_age} onChange={handleChange} /></div>
            <div className="space-y-1 md:col-span-2"><Label>Employer</Label><Input name="spouse_employer" value={formData.spouse_employer} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Position/Job Title</Label><Input name="spouse_position" value={formData.spouse_position} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Employment Status</Label><Input name="spouse_employment_status" value={formData.spouse_employment_status} onChange={handleChange} /></div>
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
            <p className="text-sm text-slate-500">No spousal details added. Click "Add Spouse" if applicable.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Children Profiles" columns={childrenCols} data={formData.spouse_children} onChange={(d) => handleGrid('spouse_children', d)} />
      </div>
    </div>
  );
};
