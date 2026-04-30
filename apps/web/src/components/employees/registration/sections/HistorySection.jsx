import React from "react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

export const HistorySection = ({ formData, handleGrid, prevEmpCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="w-full">
          <DynamicGrid title="Previous Employment Records" columns={prevEmpCols} data={formData.previous_employment} onChange={(d) => handleGrid('previous_employment', d)} />
        </div>
      </div>
    </div>
  );
};
