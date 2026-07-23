import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DynamicGrid from "@/components/employees/registration/DynamicGrid";

export default function EducationTab({ employee, isReadOnly = false, isEditing = false, onUpdate, requestedChanges = null }) {
  const [expandedIndices, setExpandedIndices] = useState([]);
  const [isMainExpanded, setIsMainExpanded] = useState(true);

  const toggleExpand = (index) => {
    setExpandedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const eduCols = [
    { key: 'level', label: 'Level', span: 3 }, { key: 'school', label: 'Name of School', span: 5 }, { key: 'address', label: 'School Address', span: 4 },
    { key: 'degree', label: 'Degree Earned', span: 4 }, { key: 'gradYear', label: 'Grad Date', type: 'date', span: 2 }, { key: 'units', label: 'Units Completed', span: 2 },
    { key: 'gwa', label: 'GWA', span: 1 }, { key: 'inclusive', label: 'Inclusive Date of Attendance', span: 3 },
    { key: 'thesis', label: 'Thesis/Dissertation', span: 4 }, { key: 'honors', label: 'Graduation Honors', span: 3 }, 
    { key: 'awards', label: 'Awards', span: 3 }, { key: 'remarks', label: 'Remarks', span: 2 }
  ];

  const checkUpdated = (name) => {
    if (!requestedChanges) return false;
    return Object.prototype.hasOwnProperty.call(requestedChanges, name);
  };

  const isListUpdated = checkUpdated('educational_record');

  return (
    <div className="space-y-6">
      <Card className="shadow-none border border-slate-200 rounded-[8px] bg-white">
        <CardHeader 
          className="flex flex-row items-center justify-between pb-2 bg-[#0C005F]/5 cursor-pointer hover:bg-[#0C005F]/10 transition-colors"
          onClick={() => setIsMainExpanded(!isMainExpanded)}
        >
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
            Educational Record
          </CardTitle>
          <div className="flex items-center gap-3">
            {isListUpdated && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 animate-pulse uppercase font-bold">Updated</Badge>}
            {isEditing && <Badge variant="secondary" className="animate-pulse">Editing</Badge>}
            <ChevronDown className={`w-4 h-4 text-[#0C005F] transition-transform duration-300 ${isMainExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>
        {isMainExpanded && (
          <CardContent className="p-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                  {employee.educational_record.map((edu, i) => {
                    const isExpanded = expandedIndices.includes(i);
                    return (
                      <div key={i} className={`border rounded-lg p-4 transition-all duration-300 ${isListUpdated ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/10'}`}>
                         <div className="flex justify-between items-start">
                           <div className="cursor-pointer flex-1" onClick={() => toggleExpand(i)}>
                             <p className="text-[10px] text-primary uppercase font-bold tracking-widest leading-none mb-1">{edu.level}</p>
                             <h4 className="font-bold text-foreground text-sm uppercase">{edu.school}</h4>
                             <p className="text-[11px] text-muted-foreground">{edu.address}</p>
                           </div>
                           <div className="flex items-center gap-3">
                             {edu.inclusive && edu.inclusive !== 'N/A' && edu.inclusive !== 'n/a' && (
                               <Badge className="text-[10px] bg-[#0C005F] text-white font-bold h-5 border-none hover:bg-[#0C005F]/90">{edu.inclusive}</Badge>
                             )}
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 w-8 p-0 hover:bg-[#0C005F]/5 text-[#0C005F]" 
                               onClick={(e) => { e.stopPropagation(); toggleExpand(i); }}
                             >
                               <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                             </Button>
                           </div>
                         </div>
                         
                         {isExpanded && (
                           <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                                <div>
                                  <p className="text-[11px] text-muted-foreground uppercase">Degree Earned</p>
                                  <p className="text-sm font-semibold">{edu.degree || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-muted-foreground uppercase">Units/GWA</p>
                                  <p className="text-sm font-semibold">Units: {edu.units} | GWA: {edu.gwa}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-muted-foreground uppercase">Graduation Honors</p>
                                  <p className="text-sm font-semibold">{edu.honors || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-muted-foreground uppercase">Awards</p>
                                  <p className="text-sm font-semibold">{edu.awards || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[11px] text-muted-foreground uppercase">Thesis/Dissertation</p>
                                  <p className="text-xs font-medium italic">{edu.thesis || 'None'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[11px] text-muted-foreground uppercase">Remarks</p>
                                  <p className="text-xs">{edu.remarks || '—'}</p>
                                </div>
                             </div>
                             <div className="mt-4 text-[10px] text-muted-foreground flex justify-end pt-2 border-t border-dashed">
                                Graduation Date: <span className="font-bold ml-1">{edu.gradYear}</span>
                             </div>
                           </div>
                         )}
                      </div>
                    );
                  })}
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
        )}
      </Card>
    </div>
  );
}
