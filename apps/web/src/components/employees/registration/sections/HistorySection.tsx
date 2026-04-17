import React from "react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface HistorySectionProps {
  formData: any;
  handleGrid: (key: string, data: any[]) => void;
  prevEmpCols: any[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({ formData, handleGrid, prevEmpCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="w-full">
          <DynamicGrid title="Previous Employment Records" columns={prevEmpCols} data={formData.previous_employment} onChange={(d: any) => handleGrid('previous_employment', d)} />
        </div>
      </div>
    </div>
  );
};
