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

export default function TrainingDevTab({ employee, isReadOnly = false }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Awards / Citations */}
        <SectionBlock title="Awards & Citations" icon={Award} isReadOnly={isReadOnly}>
          <EmptyState icon={Award} title="Awards & Citations" />
        </SectionBlock>

        {/* Research Work / Scholarships */}
        <SectionBlock title="Research Work & Scholarships" icon={BookOpen} isReadOnly={isReadOnly}>
          <EmptyState icon={BookOpen} title="Research Work" />
        </SectionBlock>

        {/* Licenses */}
        <SectionBlock title="Licenses" icon={FileText} isReadOnly={isReadOnly}>
          <EmptyState icon={FileText} title="Licenses" />
        </SectionBlock>

        {/* Exams Record */}
        <SectionBlock title="Exams Record" icon={FileText} isReadOnly={isReadOnly}>
          <EmptyState icon={FileText} title="Exams" />
        </SectionBlock>
      </div>

      <div className="space-y-6">
        {/* Training/Seminar Record */}
        <SectionBlock title="Training & Seminar Records" icon={Activity} isReadOnly={isReadOnly}>
          <EmptyState icon={Activity} title="Trainings" />
        </SectionBlock>

        {/* Extra Activities/Services */}
        <SectionBlock title="Extra Activities & Services" icon={Activity} isReadOnly={isReadOnly}>
          <EmptyState icon={Activity} title="Activities" />
        </SectionBlock>

        {/* Group Affiliations */}
        <SectionBlock title="Group Affiliations" icon={Users} isReadOnly={isReadOnly}>
           <EmptyState icon={Users} title="Group Affiliations" />
        </SectionBlock>
      </div>
    </div>
  );
}
