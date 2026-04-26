import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, BookOpen } from "lucide-react";
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

export default function CredentialsTab({ employee, isEditing = false, onUpdate, requestedChanges = null }) {
  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    if (requestedChanges[name] !== undefined && JSON.stringify(requestedChanges[name]) !== JSON.stringify(employee[name])) {
      return true;
    }
    return false;
  };

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
  const scholarCols = [
     { key: 'type', label: 'Work Type', span: 4 }, { key: 'spec', label: 'Specification', span: 4 }, { key: 'title', label: 'Complete Title', span: 4 },
     { key: 'status', label: 'Work Status', span: 2 }, { key: 'agency', label: 'Granting Agency', span: 3 }, { key: 'date', label: 'Date Given', type: 'date', span: 2 },
     { key: 'place', label: 'Place Given', span: 2 }, { key: 'remarks', label: 'Remarks', span: 3 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Licenses */}
        <SectionBlock title="Professional Licenses" icon={Shield} isEditing={isEditing}>
          {checkUpdated('licenses') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-4">
            {isEditing ? (
              <DynamicGrid 
                title="Licenses" 
                columns={licenseCols} 
                data={employee.licenses || []} 
                onChange={(newData) => onUpdate('licenses', newData)} 
              />
            ) : (
              <>
                {employee.licenses?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.licenses.map((lic, i) => (
                      <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${checkUpdated('licenses') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <div className="flex justify-between items-start">
                          <div className="max-w-[70%]">
                            <p className="text-sm font-bold leading-tight">{lic.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">License No: <span className="font-semibold">{lic.number}</span></p>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-white">Valid until {lic.expiry}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1 border-t">
                          <span>Issued: <span className="text-foreground">{lic.issued}</span></span>
                          <span>Place: <span className="text-foreground">{lic.place}</span></span>
                        </div>
                        {lic.remarks && <p className="text-[10px] italic border-t pt-1">Note: {lic.remarks}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="licenses" />
                )}
              </>
            )}
          </div>
        </SectionBlock>

        {/* Exams */}
        <SectionBlock title="Government & Board Examinations" icon={FileText} isEditing={isEditing}>
          {checkUpdated('exams_taken') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-4">
            {isEditing ? (
              <DynamicGrid 
                title="Board Exams" 
                columns={examsCols} 
                data={employee.exams_taken || []} 
                onChange={(newData) => onUpdate('exams_taken', newData)} 
              />
            ) : (
              <>
                {employee.exams_taken?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.exams_taken.map((exam, i) => (
                      <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${checkUpdated('exams_taken') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
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
                        {exam.rank && (
                          <div className="bg-yellow-50 border border-yellow-100 p-1.5 rounded text-center">
                             <p className="text-[10px] text-yellow-800 font-bold uppercase tracking-widest">Rank: {exam.rank}</p>
                          </div>
                        )}
                        {exam.remarks && <p className="text-[10px] italic text-muted-foreground">{exam.remarks}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="exams" />
                )}
              </>
            )}
          </div>
        </SectionBlock>
      </div>

      <div className="space-y-6">
        {/* Scholarships / Research */}
        <SectionBlock title="Scholarships & Research Work" icon={BookOpen} isEditing={isEditing}>
          {checkUpdated('scholarships_research') && (
            <Badge variant="outline" className="mb-2 h-4 text-[9px] bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">List Updated</Badge>
          )}
          <div className="space-y-4">
            {isEditing ? (
              <DynamicGrid 
                title="Scholarships / Research" 
                columns={scholarCols} 
                data={employee.scholarships_research || []} 
                onChange={(newData) => onUpdate('scholarships_research', newData)} 
              />
            ) : (
              <>
                {employee.scholarships_research?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employee.scholarships_research.map((work, i) => (
                      <div key={i} className={`p-3 rounded-md border space-y-2 transition-colors ${checkUpdated('scholarships_research') ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                        <div className="flex justify-between items-start">
                          <div className="max-w-[75%]">
                            <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">{work.type} • {work.status}</p>
                            <p className="text-sm font-bold leading-tight uppercase underline underline-offset-2">{work.title}</p>
                          </div>
                          <Badge className="text-[10px] uppercase">{work.date}</Badge>
                        </div>
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p>Specification: <span className="text-foreground">{work.spec}</span></p>
                          <p>Granting Agency: <span className="text-foreground">{work.agency}</span></p>
                          <p>Venue/Place: <span className="text-foreground font-medium">{work.place}</span></p>
                        </div>
                        {work.remarks && <p className="text-[11px] pt-1 mt-1 border-t italic text-slate-500">Note: {work.remarks}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="works/scholarships" />
                )}
              </>
            )}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}
