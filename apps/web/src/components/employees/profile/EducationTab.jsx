import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

export default function EducationTab({ employee, isReadOnly = false, isEditing = false, onUpdate, requestedChanges = null }) {
  const eduCols = [
    { key: 'level', label: 'Level', span: 3 }, { key: 'school', label: 'Name of School', span: 5 }, { key: 'address', label: 'School Address', span: 4 },
    { key: 'degree', label: 'Degree Earned', span: 3 }, { key: 'gradYear', label: 'Grad Year', span: 2 }, { key: 'units', label: 'Units Completed', span: 2 },
    { key: 'thesis', label: 'Thesis/Dissertation', span: 2 }, { key: 'gwa', label: 'GWA', span: 1 }, { key: 'inclusive', label: 'Inclusive Dates', span: 2 }
  ];

  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    if (requestedChanges[name] !== undefined && JSON.stringify(requestedChanges[name]) !== JSON.stringify(employee[name])) {
      return true;
    }
    return false;
  };

  const isListUpdated = checkUpdated('educational_record');

  return (
    <div className="space-y-6">
      <Card className="shadow-none border-muted">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-[#0C005F]/5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Educational Record
          </CardTitle>
          {isListUpdated && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">Updated</Badge>}
          {isEditing && <Badge variant="secondary" className="animate-pulse">Editing</Badge>}
        </CardHeader>
        <CardContent className="p-4">
          {isEditing ? (
            <DynamicGrid 
              title="Education Records" 
              columns={eduCols} 
              data={employee.educational_record || []} 
              onChange={onUpdate} 
            />
          ) : (
            <>
              {employee.educational_record && employee.educational_record.length > 0 ? (
                <div className="space-y-4">
                  {employee.educational_record.map((edu, i) => (
                    <div key={i} className={`border rounded-lg p-4 transition-colors ${isListUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/20'}`}>
                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <p className="text-[10px] text-primary uppercase font-bold tracking-widest leading-none mb-1">{edu.level}</p>
                           <h4 className="font-bold text-foreground text-sm uppercase">{edu.school}</h4>
                           <p className="text-[11px] text-muted-foreground">{edu.address}</p>
                         </div>
                         <Badge variant="secondary" className="text-[10px]">{edu.inclusive}</Badge>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase">Degree Earned</p>
                            <p className="text-sm font-semibold">{edu.degree || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase">Units/GWA</p>
                            <p className="text-sm font-semibold">Units: {edu.units} | GWA: {edu.gwa}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] text-muted-foreground uppercase">Thesis/Dissertation</p>
                            <p className="text-xs font-medium italic">{edu.thesis || 'None'}</p>
                          </div>
                       </div>
                       <div className="mt-2 text-[10px] text-muted-foreground flex justify-end">
                          Graduation Year: <span className="font-bold ml-1">{edu.gradYear}</span>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md border-dashed p-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
                  <GraduationCap className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No educational records found.</p>
                  <p className="text-xs mt-1">Visit the registration portal to add education details.</p>
                </div>
              )}
            </>
          )}

          {/* Example Data Format */}
          {/* <div className="mt-4 space-y-4">
            <div className="border rounded-lg p-4 bg-muted/20">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="font-semibold text-foreground">Bachelor of Science in Computer Science</h4>
                   <p className="text-sm text-foreground">University of the Philippines</p>
                 </div>
                 <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">2010 - 2014</span>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase">Education Level</p>
                    <p className="text-sm font-medium">College</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground uppercase">School Address</p>
                    <p className="text-sm font-medium">Diliman, Quezon City</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase">Honors/Awards</p>
                    <p className="text-sm font-medium">Cum Laude</p>
                  </div>
               </div>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
