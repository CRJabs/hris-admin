import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Award, BookOpen, FileText, Activity, Users, Shield, Zap, Globe, ShieldAlert, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

function EmptyState({ icon: Icon, title }) {
  return (
    <div className="border rounded-md border-dashed py-6 px-4 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
      <Icon className="w-6 h-6 mb-2 opacity-20" />
      <p className="text-sm font-medium">No records found for {title}.</p>
    </div>
  );
}

function ExpandableItem({ children, titleContent, sideContent, isUpdated = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`border rounded-lg transition-all duration-300 ${isUpdated ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-muted/10'}`}>
      <div 
        className="p-3 flex justify-between items-start cursor-pointer hover:bg-[#0C005F]/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          {titleContent}
        </div>
        <div className="flex items-center gap-3">
          {sideContent}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-[#0C005F]" 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

function SectionBlock({ title, data, icon: Icon, isEditing, columns, onUpdate, isUpdated = false, renderItem }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="shadow-none border border-slate-200 rounded-xl bg-white">
      <CardHeader 
        className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 bg-[#0C005F]/5 cursor-pointer hover:bg-[#0C005F]/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isEditing && <Badge variant="secondary" className="animate-pulse">Editing</Badge>}
          <ChevronDown className={`w-4 h-4 text-[#0C005F] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {isEditing ? (
            <DynamicGrid 
              title={title} 
              columns={columns} 
              data={data || []} 
              onChange={onUpdate} 
            />
          ) : (
            <>
              {data && data.length > 0 ? (
                <div className="space-y-3">
                   {data.map((item, i) => renderItem(item, i, isUpdated))}
                </div>
              ) : (
                <EmptyState icon={Icon} title={title} />
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function TrainingDevTab({ employee, isReadOnly = false, isEditing = false, onUpdate, requestedChanges = null }) {
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    return Object.prototype.hasOwnProperty.call(requestedChanges, name);
  };

  const trainCols = [
    { key: 'name', label: 'Seminar/Training Name', span: 4 }, { key: 'type', label: 'Type', span: 2 }, { key: 'budget', label: 'Approved Budget', span: 2 },
    { key: 'venue', label: 'Venue', span: 2 }, { key: 'duration', label: 'Duration', span: 2 }, 
    { key: 'conducted', label: 'Conducted By', span: 3 },
    { key: 'start_date', label: 'Start Date', type: 'date', span: 2 }, { key: 'end_date', label: 'End Date', type: 'date', span: 2 }, 
    { key: 'notes', label: 'Notes', span: 5 }
  ];

  const licenseCols = [
    { key: 'name', label: 'License Name', span: 3 }, { key: 'number', label: 'License No.', span: 2 },
    { key: 'issued', label: 'Issued Date', type: 'date', span: 2 }, { key: 'expiry', label: 'Expiry Date', type: 'date', span: 2 },
    { key: 'place', label: 'Place Issued', span: 2 }, { key: 'remarks', label: 'Remarks', span: 1 }
  ];

  const examsCols = [
    { key: 'title', label: 'Exam Title', span: 3 }, { key: 'date', label: 'Date Taken', type: 'date', span: 2 },
    { key: 'place', label: 'Place Taken', span: 2 }, { key: 'rank', label: 'Rank (If Applicable)', span: 2 },
    { key: 'rating', label: 'Rating (%, GPA)', span: 2 }, { key: 'remarks', label: 'Remarks', span: 1 }
  ];

  const skillsCols = [
    { key: 'skill', label: 'Skill', span: 6 }, { key: 'years', label: 'Years of Use', span: 2 },
    { 
      key: 'level', 
      label: 'Level of Expertise', 
      span: 4, 
      type: 'select',
      options: ["Beginner", "Intermediate", "Advanced", "Expert"],
      placeholder: 'Select Level' 
    }
  ];

  const affiliationCols = [
    { key: 'org', label: 'Organization', span: 6 }, { key: 'place', label: 'Place/Station', span: 6 },
    { key: 'position', label: 'Position', span: 6 }, 
    { key: 'start_date', label: 'Start Date', type: 'date', span: 3 }, { key: 'end_date', label: 'End Date', type: 'date', span: 3 }
  ];

  const awardsCols = [
    { key: 'type', label: 'Reward Type', span: 4 }, { key: 'name', label: 'Reward Name', span: 8 },
    { key: 'agency', label: 'Granting Agency/Org', span: 4 }, { key: 'date', label: 'Date Given', type: 'date', span: 3 },
    { key: 'place', label: 'Place Given', span: 3 }, { key: 'remarks', label: 'Remarks', span: 2 }
  ];

  const scholarCols = [
    { key: 'type', label: 'Work Type', span: 4 }, { key: 'spec', label: 'Specification', span: 4, placeholder: 'Study/Travel/Thesis' }, { key: 'title', label: 'Complete Title', span: 4 },
    { key: 'status', label: 'Work Status', span: 2 }, { key: 'agency', label: 'Granting Agency', span: 3 }, { key: 'date', label: 'Date Given', type: 'date', span: 2 },
    { key: 'place', label: 'Place Given', span: 2 }, { key: 'remarks', label: 'Remarks', span: 3 }
  ];

  const extraCols = [
    { key: 'type', label: 'Service/Activity Type', span: 4 }, { key: 'nature_act', label: 'Nature of Activity/Project', span: 8 },
    { key: 'nature_part', label: 'Nature of Participation', span: 5 }, { key: 'date', label: 'Date', type: 'date', span: 3 },
    { key: 'remarks', label: 'Remarks', span: 4 }
  ];

  return (
    <div className="space-y-6">
        <SectionBlock 
          title="Internal Trainings" 
          icon={Activity} 
          data={employee.internal_trainings} 
          isEditing={isEditing}
          columns={trainCols}
          onUpdate={(newData) => onUpdate('internal_trainings', newData)}
          isUpdated={checkUpdated('internal_trainings')}
          renderItem={(train, i, isUpdated) => (
            <ExpandableItem 
              key={i}
              isUpdated={isUpdated}
              titleContent={
                <div className="max-w-[95%]">
                  <p className="text-sm font-bold leading-tight uppercase">{train.name}</p>
                  <p className="text-2xs text-muted-foreground mt-1 uppercase tracking-wider">{train.venue} • {train.duration}</p>
                </div>
              }
              sideContent={
                <Badge variant="outline" className="text-[10px] bg-white whitespace-nowrap">{train.start_date || '—'} - {train.end_date || '—'}</Badge>
              }
            >
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-3 mt-1 border-t text-[11px] text-muted-foreground">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase opacity-60">Training Type</span>
                  <span className="text-foreground font-medium">{train.type}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase opacity-60">Conducted By</span>
                  <span className="text-foreground font-medium">{train.conducted}</span>
                </div>
                {train.budget && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase opacity-60">Approved Budget</span>
                    <span className="text-foreground font-medium">{train.budget}</span>
                  </div>
                )}
                {train.notes && (
                  <div className="flex flex-col w-full">
                    <span className="text-[9px] font-bold uppercase opacity-60">Additional Notes</span>
                    <span className="text-foreground leading-relaxed italic">{train.notes}</span>
                  </div>
                )}
              </div>
            </ExpandableItem>
          )}
        />

        <SectionBlock 
          title="External Trainings" 
          icon={Activity} 
          data={employee.external_trainings} 
          isEditing={isEditing}
          columns={trainCols}
          onUpdate={(newData) => onUpdate('external_trainings', newData)}
          isUpdated={checkUpdated('external_trainings')}
          renderItem={(train, i, isUpdated) => (
            <ExpandableItem 
              key={i}
              isUpdated={isUpdated}
              titleContent={
                <div className="max-w-[95%]">
                  <p className="text-sm font-bold leading-tight uppercase">{train.name}</p>
                  <p className="text-2xs text-muted-foreground mt-1 uppercase tracking-wider">{train.venue} • {train.duration}</p>
                </div>
              }
              sideContent={
                <Badge variant="outline" className="text-[10px] bg-white whitespace-nowrap">{train.start_date || '—'} - {train.end_date || '—'}</Badge>
              }
            >
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-3 mt-1 border-t text-[11px] text-muted-foreground">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase opacity-60">Training Type</span>
                  <span className="text-foreground font-medium">{train.type}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase opacity-60">Conducted By</span>
                  <span className="text-foreground font-medium">{train.conducted}</span>
                </div>
                {train.budget && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase opacity-60">Approved Budget</span>
                    <span className="text-foreground font-medium">{train.budget}</span>
                  </div>
                )}
                {train.notes && (
                  <div className="flex flex-col w-full">
                    <span className="text-[9px] font-bold uppercase opacity-60">Additional Notes</span>
                    <span className="text-foreground leading-relaxed italic">{train.notes}</span>
                  </div>
                )}
              </div>
            </ExpandableItem>
          )}
        />

        <SectionBlock 
          title="Awards & Citations" 
          icon={Award} 
          data={employee.awards_citations} 
          isEditing={isEditing}
          columns={awardsCols}
          onUpdate={(newData) => onUpdate('awards_citations', newData)}
          isUpdated={checkUpdated('awards_citations')}
          renderItem={(award, i, isUpdated) => (
            <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <div className="flex justify-between items-start">
                <div className="max-w-[70%]">
                  <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">{award.type}</p>
                  <p className="text-sm font-bold leading-tight">{award.name}</p>
                </div>
                <Badge className="text-[10px] bg-[#0C005F]">{award.date}</Badge>
              </div>
            </div>
          )}
        />

        <SectionBlock 
          title="Scholarships & Research Work" 
          icon={BookOpen} 
          data={employee.scholarships_research} 
          isEditing={isEditing}
          columns={scholarCols}
          onUpdate={(newData) => onUpdate('scholarships_research', newData)}
          isUpdated={checkUpdated('scholarships_research')}
          renderItem={(work, i, isUpdated) => (
            <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <div className="flex justify-between items-start">
                <div className="max-w-[75%]">
                  <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">{work.type} • {work.status}</p>
                  <p className="text-sm font-bold leading-tight uppercase underline underline-offset-2">{work.title}</p>
                </div>
                <Badge className="text-[10px] uppercase">{work.date}</Badge>
              </div>
            </div>
          )}
        />

        <SectionBlock 
          title="Professional Licenses" 
          icon={Shield} 
          data={employee.licenses} 
          isEditing={isEditing}
          columns={licenseCols}
          onUpdate={(newData) => onUpdate('licenses', newData)}
          isUpdated={checkUpdated('licenses')}
          renderItem={(lic, i, isUpdated) => (
            <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <div className="flex justify-between items-start">
                <div className="max-w-[70%]">
                  <p className="text-sm font-bold leading-tight">{lic.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">License No: <span className="font-semibold">{lic.number}</span></p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-2xs bg-white ${
                    lic.expiry && new Date(lic.expiry) < new Date() 
                      ? 'text-red-600 border-red-200' 
                      : lic.expiry && (new Date(lic.expiry) - new Date()) / (1000 * 60 * 60 * 24) <= 90
                        ? 'text-amber-600 border-amber-200'
                        : 'text-muted-foreground'
                  }`}
                >
                  Valid until {lic.expiry}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t">
                <span>Issued: <span className="text-foreground">{lic.issued}</span></span>
                <span>Place: <span className="text-foreground">{lic.place}</span></span>
              </div>
            </div>
          )}
        />

        <SectionBlock 
          title="Government & Board Examinations" 
          icon={FileText} 
          data={employee.exams_taken} 
          isEditing={isEditing}
          columns={examsCols}
          onUpdate={(newData) => onUpdate('exams_taken', newData)}
          isUpdated={checkUpdated('exams_taken')}
          renderItem={(exam, i, isUpdated) => (
            <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <div className="flex justify-between items-start">
                <div className="max-w-[70%]">
                  <p className="text-sm font-bold leading-tight">{exam.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{exam.place} • {exam.date}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
                   <p className="text-sm font-bold text-[#0C005F]">{exam.rating || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        />

        <SectionBlock 
          title="Specific Skills" 
          icon={Zap} 
          data={employee.skills} 
          isEditing={isEditing}
          columns={skillsCols}
          onUpdate={(newData) => onUpdate('skills', newData)}
          isUpdated={checkUpdated('skills')}
          renderItem={(skill, i, isUpdated) => (
            <div key={i} className={`flex items-center justify-between p-2 rounded-md border transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <div>
                <p className="text-sm font-semibold">{skill.skill}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{skill.level || 'Not specified'}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{skill.years} Years</Badge>
            </div>
          )}
        />

        <SectionBlock 
          title="Professional Affiliations" 
          icon={Users} 
          data={employee.group_affiliations} 
          isEditing={isEditing}
          columns={affiliationCols}
          onUpdate={(newData) => onUpdate('group_affiliations', newData)}
          isUpdated={checkUpdated('group_affiliations')}
          renderItem={(org, i, isUpdated) => (
            <div key={i} className={`p-3 rounded-md border space-y-1 transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <p className="text-sm font-bold">{org.org}</p>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{org.position} • {org.place}</span>
                <span className="font-medium">{org.start_date || '—'} - {org.end_date || '—'}</span>
              </div>
            </div>
          )}
        />

        <SectionBlock 
          title="Extra Activities / Services" 
          icon={ShieldAlert} 
          data={employee.extra_activities} 
          isEditing={isEditing}
          columns={extraCols}
          onUpdate={(newData) => onUpdate('extra_activities', newData)}
          isUpdated={checkUpdated('extra_activities')}
          renderItem={(act, i, isUpdated) => (
            <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${isUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
              <div className="flex justify-between items-start">
                <div className="max-w-[75%]">
                  <p className="text-[10px] text-primary uppercase font-bold">{act.type}</p>
                  <p className="text-sm font-bold leading-tight">{act.nature_act}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{act.date}</span>
              </div>
            </div>
          )}
        />
    </div>
  );
}
