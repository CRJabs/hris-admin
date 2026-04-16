import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap } from "lucide-react";

export default function EducationTab({ employee, isReadOnly = false }) {
  return (
    <div className="space-y-6">
      <Card className="shadow-none border-muted">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Educational Record
          </CardTitle>
          {!isReadOnly && (
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md border-dashed p-8 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
            <GraduationCap className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">No educational records found.</p>
            <p className="text-xs mt-1">Click "Add Record" to add education details.</p>
          </div>

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
