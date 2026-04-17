import React from "react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface CredentialsSectionProps {
  formData: any;
  handleGrid: (key: string, data: any[]) => void;
  licenseCols: any[];
  examsCols: any[];
  scholarCols: any[];
}

export const CredentialsSection: React.FC<CredentialsSectionProps> = ({ formData, handleGrid, licenseCols, examsCols, scholarCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Professional Licenses" columns={licenseCols} data={formData.licenses} onChange={(d: any) => handleGrid('licenses', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Exams Taken" columns={examsCols} data={formData.exams_taken} onChange={(d: any) => handleGrid('exams_taken', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Scholarships & Research Works" columns={scholarCols} data={formData.scholarships_research} onChange={(d: any) => handleGrid('scholarships_research', d)} />
      </div>
    </div>
  );
};
