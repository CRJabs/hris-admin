import React from "react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface EducationSectionProps {
  formData: any;
  handleGrid: (key: string, data: any[]) => void;
  eduCols: any[];
  trainCols: any[];
  skillsCols: any[];
  awardsCols: any[];
  extraCols: any[];
  affiliationCols: any[];
  licenseCols: any[];
  examsCols: any[];
  scholarCols: any[];
}

export const EducationSection: React.FC<EducationSectionProps> = ({ 
  formData, handleGrid, eduCols, trainCols, skillsCols, awardsCols, extraCols, affiliationCols, 
  licenseCols, examsCols, scholarCols 
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <DynamicGrid title="Educational Background" columns={eduCols} data={formData.educational_record} onChange={(d: any) => handleGrid('educational_record', d)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Internal Trainings" columns={trainCols} data={formData.internal_trainings} onChange={(d: any) => handleGrid('internal_trainings', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="External Trainings (within 5 years)" columns={trainCols} data={formData.external_trainings} onChange={(d: any) => handleGrid('external_trainings', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Professional Licenses" columns={licenseCols} data={formData.licenses} onChange={(d: any) => handleGrid('licenses', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Government & Board Examinations" columns={examsCols} data={formData.exams_taken} onChange={(d: any) => handleGrid('exams_taken', d)} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Specific Skills" columns={skillsCols} data={formData.skills} onChange={(d: any) => handleGrid('skills', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Awards & Citations" columns={awardsCols} data={formData.awards_citations} onChange={(d: any) => handleGrid('awards_citations', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Scholarships & Research Work" columns={scholarCols} data={formData.scholarships_research} onChange={(d: any) => handleGrid('scholarships_research', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Group Affiliations" columns={affiliationCols} data={formData.group_affiliations} onChange={(d: any) => handleGrid('group_affiliations', d)} />
          </div>
          <div className="bg-white rounded-xl border shadow-sm">
            <DynamicGrid title="Extra Activities / Services" columns={extraCols} data={formData.extra_activities} onChange={(d: any) => handleGrid('extra_activities', d)} />
          </div>
        </div>
      </div>
    </div>
  );
};
