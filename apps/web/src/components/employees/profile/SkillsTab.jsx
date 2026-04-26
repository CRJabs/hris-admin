import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Globe, Zap, Users, ShieldAlert } from "lucide-react";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

function SectionBlock({ title, icon: Icon, children, isEditing }) {
  return (
    <Card className="shadow-none border-muted">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 bg-[#0C005F]/5">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        {isEditing && <Badge variant="secondary" className="animate-pulse">Editing</Badge>}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title }) {
  return (
    <div className="py-4 text-center text-muted-foreground italic text-xs border rounded-md border-dashed">
      No {title} recorded.
    </div>
  );
}

export default function SkillsTab({ employee, isEditing = false, onUpdate, requestedChanges = null }) {
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    if (requestedChanges[name] !== undefined && JSON.stringify(requestedChanges[name]) !== JSON.stringify(employee[name])) {
      return true;
    }
    return false;
  };

  const skillsCols = [
    { key: 'skill', label: 'Skill', span: 6 }, { key: 'years', label: 'Years of Use', span: 2 },
    { key: 'level', label: 'Level of Expertise', span: 4, placeholder: 'Beginner/Intermediate/Advance/Expert' }
  ];
  const langCols = [
    { key: 'language', label: 'Language', span: 4 }, { key: 'literacy', label: 'Literacy (Speak/Read/Write)', span: 4 },
    { key: 'fluency', label: 'Fluency Scale', span: 4, placeholder: 'Beginner/Intermediate/Advance/Expert' }
  ];
  const affiliationCols = [
    { key: 'org', label: 'Organization', span: 4 }, { key: 'place', label: 'Place/Station', span: 3 },
    { key: 'position', label: 'Position', span: 3 }, { key: 'dates', label: 'Inclusive Dates', span: 2 }
  ];
  const awardsCols = [
    { key: 'type', label: 'Reward Type', span: 4 }, { key: 'name', label: 'Reward Name', span: 8 },
    { key: 'agency', label: 'Granting Agency/Org', span: 4 }, { key: 'date', label: 'Date Given', type: 'date', span: 3 },
    { key: 'place', label: 'Place Given', span: 3 }, { key: 'remarks', label: 'Remarks', span: 2 }
  ];
  const extraCols = [
    { key: 'type', label: 'Service/Activity Type', span: 4 }, { key: 'nature_act', label: 'Nature of Activity/Project', span: 8 },
    { key: 'nature_part', label: 'Nature of Participation', span: 5 }, { key: 'date', label: 'Date', type: 'date', span: 3 },
    { key: 'remarks', label: 'Remarks', span: 4 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Skills */}
        <SectionBlock title="Specialized Skills" icon={Zap} isEditing={isEditing}>
          {checkUpdated('skills') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-3">
            {isEditing ? (
              <DynamicGrid 
                title="Skills" 
                columns={skillsCols} 
                data={employee.skills || []} 
                onChange={(newData) => onUpdate('skills', newData)} 
              />
            ) : (
              <>
                {employee.skills?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.skills.map((skill, i) => (
                      <div key={i} className={`flex items-center justify-between p-2 rounded-md border transition-colors ${checkUpdated('skills') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <div>
                          <p className="text-sm font-semibold">{skill.skill}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{skill.level || 'Not specified'}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{skill.years} Years</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="skills" />
                )}
              </>
            )}
          </div>
        </SectionBlock>

        {/* Languages */}
        <SectionBlock title="Languages & Literacy" icon={Globe} isEditing={isEditing}>
          {checkUpdated('languages') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-3">
            {isEditing ? (
              <DynamicGrid 
                title="Languages" 
                columns={langCols} 
                data={employee.languages || []} 
                onChange={(newData) => onUpdate('languages', newData)} 
              />
            ) : (
              <>
                {employee.languages?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.languages.map((lang, i) => (
                      <div key={i} className={`p-3 rounded-md border transition-colors ${checkUpdated('languages') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-bold">{lang.language}</p>
                          <Badge variant="outline" className="text-[10px]">{lang.fluency}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic">{lang.literacy}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="languages" />
                )}
              </>
            )}
          </div>
        </SectionBlock>

        {/* Group Affiliations */}
        <SectionBlock title="Professional Affiliations" icon={Users} isEditing={isEditing}>
          {checkUpdated('group_affiliations') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-3">
            {isEditing ? (
              <DynamicGrid 
                title="Affiliations" 
                columns={affiliationCols} 
                data={employee.group_affiliations || []} 
                onChange={(newData) => onUpdate('group_affiliations', newData)} 
              />
            ) : (
              <>
                {employee.group_affiliations?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {employee.group_affiliations.map((org, i) => (
                      <div key={i} className={`p-3 rounded-md border space-y-1 transition-colors ${checkUpdated('group_affiliations') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <p className="text-sm font-bold">{org.org}</p>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{org.position} • {org.place}</span>
                          <span className="font-medium">{org.dates}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="affiliations" />
                )}
              </>
            )}
          </div>
        </SectionBlock>
      </div>

      <div className="space-y-6">
        {/* Awards */}
        <SectionBlock title="Awards & Citations" icon={Award} isEditing={isEditing}>
          {checkUpdated('awards_citations') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-3">
            {isEditing ? (
              <DynamicGrid 
                title="Awards" 
                columns={awardsCols} 
                data={employee.awards_citations || []} 
                onChange={(newData) => onUpdate('awards_citations', newData)} 
              />
            ) : (
              <>
                {employee.awards_citations?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.awards_citations.map((award, i) => (
                      <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${checkUpdated('awards_citations') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <div className="flex justify-between items-start">
                          <div className="max-w-[70%]">
                            <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">{award.type}</p>
                            <p className="text-sm font-bold leading-tight">{award.name}</p>
                          </div>
                          <Badge className="text-[10px] bg-[#0C005F]">{award.date}</Badge>
                        </div>
                        <div className="flex flex-col text-[11px] text-muted-foreground">
                          <span>{award.agency}</span>
                          <span className="italic">{award.place}</span>
                        </div>
                        {award.remarks && <p className="text-[10px] pt-1 mt-1 border-t italic">Note: {award.remarks}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="awards" />
                )}
              </>
            )}
          </div>
        </SectionBlock>

        {/* Extra Activities */}
        <SectionBlock title="Extra Activities & Community Services" icon={ShieldAlert} isEditing={isEditing}>
          {checkUpdated('extra_activities') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-3">
            {isEditing ? (
              <DynamicGrid 
                title="Extra Activities" 
                columns={extraCols} 
                data={employee.extra_activities || []} 
                onChange={(newData) => onUpdate('extra_activities', newData)} 
              />
            ) : (
              <>
                {employee.extra_activities?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.extra_activities.map((act, i) => (
                      <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${checkUpdated('extra_activities') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <div className="flex justify-between items-start">
                          <div className="max-w-[75%]">
                            <p className="text-[10px] text-primary uppercase font-bold">{act.type}</p>
                            <p className="text-sm font-bold leading-tight">{act.nature_act}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground">{act.date}</span>
                        </div>
                        <p className="text-[11px]">Role: <span className="font-medium">{act.nature_part}</span></p>
                        {act.remarks && <p className="text-[10px] italic text-muted-foreground">{act.remarks}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="activities" />
                )}
              </>
            )}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}
