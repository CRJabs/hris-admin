import React from "react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

interface SkillsSectionProps {
  formData: any;
  handleGrid: (key: string, data: any[]) => void;
  langCols: any[];
  skillsCols: any[];
  awardsCols: any[];
  extraCols: any[];
  affiliationCols: any[];
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ formData, handleGrid, langCols, skillsCols, awardsCols, extraCols, affiliationCols }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Languages Spoken" columns={langCols} data={formData.languages} onChange={(d: any) => handleGrid('languages', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Specific Skills" columns={skillsCols} data={formData.skills} onChange={(d: any) => handleGrid('skills', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Awards & Citations" columns={awardsCols} data={formData.awards_citations} onChange={(d: any) => handleGrid('awards_citations', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Extra Activities / Services" columns={extraCols} data={formData.extra_activities} onChange={(d: any) => handleGrid('extra_activities', d)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm">
        <DynamicGrid title="Group Affiliations" columns={affiliationCols} data={formData.group_affiliations} onChange={(d: any) => handleGrid('group_affiliations', d)} />
      </div>
    </div>
  );
};
