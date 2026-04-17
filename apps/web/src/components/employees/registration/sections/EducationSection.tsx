import React from "react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface EducationSectionProps {
  formData: any;
  handleGrid: (key: string, data: any[]) => void;
  eduCols: any[];
  trainCols: any[];
}

export const EducationSection: React.FC<EducationSectionProps> = ({ formData, handleGrid, eduCols, trainCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <DynamicGrid title="Educational Background" columns={eduCols} data={formData.educational_record} onChange={(d: any) => handleGrid('educational_record', d)} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Internal Trainings" columns={trainCols} data={formData.internal_trainings} onChange={(d: any) => handleGrid('internal_trainings', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="External Trainings (within 5 years)" columns={trainCols} data={formData.external_trainings} onChange={(d: any) => handleGrid('external_trainings', d)} />
      </div>
    </div>
  );
};
