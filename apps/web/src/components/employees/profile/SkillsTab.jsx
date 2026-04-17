import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Globe, Zap, Users, ShieldAlert } from "lucide-react";

function SectionBlock({ title, icon: Icon, children }) {
  return (
    <Card className="shadow-none border-muted">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
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

export default function SkillsTab({ employee }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Skills */}
        <SectionBlock title="Specialized Skills" icon={Zap}>
          <div className="space-y-3">
            {employee.skills?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {employee.skills.map((skill, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-md border">
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
          </div>
        </SectionBlock>

        {/* Languages */}
        <SectionBlock title="Languages & Literacy" icon={Globe}>
          <div className="space-y-3">
            {employee.languages?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {employee.languages.map((lang, i) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-md border">
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
          </div>
        </SectionBlock>

        {/* Group Affiliations */}
        <SectionBlock title="Professional Affiliations" icon={Users}>
          <div className="space-y-3">
            {employee.group_affiliations?.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {employee.group_affiliations.map((org, i) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-md border space-y-1">
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
          </div>
        </SectionBlock>
      </div>

      <div className="space-y-6">
        {/* Awards */}
        <SectionBlock title="Awards & Citations" icon={Award}>
          <div className="space-y-3">
            {employee.awards_citations?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {employee.awards_citations.map((award, i) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-md border space-y-2">
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
          </div>
        </SectionBlock>

        {/* Extra Activities */}
        <SectionBlock title="Extra Activities & Community Services" icon={ShieldAlert}>
          <div className="space-y-3">
            {employee.extra_activities?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {employee.extra_activities.map((act, i) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-md border space-y-2">
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
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}
