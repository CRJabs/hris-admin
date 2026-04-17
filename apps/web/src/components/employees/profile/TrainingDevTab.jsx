import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Award, BookOpen, FileText, Activity, Users } from "lucide-react";

function EmptyState({ icon: Icon, title }) {
  return (
    <div className="border rounded-md border-dashed py-6 px-4 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
      <Icon className="w-6 h-6 mb-2 opacity-20" />
      <p className="text-sm font-medium">No records found for {title}.</p>
    </div>
  );
}

function SectionBlock({ title, icon: Icon, children, isReadOnly }) {
  return (
    <Card className="shadow-none border-muted">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        {!isReadOnly && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="w-3 h-3" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {children}
      </CardContent>
    </Card>
  );
}

function TrainingList({ title, data, icon: Icon }) {
  return (
    <Card className="shadow-none border-muted">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {data && data.length > 0 ? (
          <div className="space-y-3">
             {data.map((train, i) => (
                <div key={i} className="p-3 bg-muted/20 border rounded-lg space-y-2">
                   <div className="flex justify-between items-start">
                      <div className="max-w-[75%]">
                         <p className="text-sm font-bold leading-tight uppercase">{train.name}</p>
                         <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{train.venue} • {train.duration}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white">{train.dates}</Badge>
                   </div>
                   <div className="flex flex-wrap gap-x-4 pt-1 border-t text-[11px] text-muted-foreground">
                      <span>Type: <span className="text-foreground">{train.type}</span></span>
                      <span>Budget: <span className="text-foreground">{train.budget}</span></span>
                      <span>By: <span className="text-foreground font-medium">{train.conducted}</span></span>
                   </div>
                   {train.notes && <p className="text-[10px] italic pt-1 mt-1 border-t text-slate-500">Note: {train.notes}</p>}
                </div>
             ))}
          </div>
        ) : (
          <EmptyState icon={Icon} title={title} />
        )}
      </CardContent>
    </Card>
  );
}

export default function TrainingDevTab({ employee, isReadOnly = false }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <TrainingList 
          title="Internal Trainings & Seminars" 
          icon={Activity} 
          data={employee.internal_trainings} 
        />
      </div>

      <div className="space-y-6">
        <TrainingList 
          title="External Trainings (Within 5 Years)" 
          icon={Activity} 
          data={employee.external_trainings} 
        />
      </div>
    </div>
  );
}
