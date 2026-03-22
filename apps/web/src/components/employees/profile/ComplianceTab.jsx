import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Award, FileCheck } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

export default function ComplianceTab({ employee }) {
  const isExpiringSoon = (dateStr) => {
    if (!dateStr || dateStr === "Lifetime") return false;
    const d = new Date(dateStr);
    return !isPast(d) && differenceInDays(d, new Date()) <= 180;
  };

  const isExpired = (dateStr) => {
    if (!dateStr || dateStr === "Lifetime") return false;
    return isPast(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Education */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Educational Background
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Level</TableHead>
                <TableHead className="text-xs">School / University</TableHead>
                <TableHead className="text-xs">Course / Degree</TableHead>
                <TableHead className="text-xs">Year Graduated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employee.education || []).map((edu, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">
                    <Badge variant="secondary" className="text-[11px]">{edu.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{edu.school}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{edu.course || "—"}</TableCell>
                  <TableCell className="text-sm">{edu.year_graduated}</TableCell>
                </TableRow>
              ))}
              {(!employee.education || employee.education.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                    No educational records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trainings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4" />
            Trainings Attended
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Training Title</TableHead>
                <TableHead className="text-xs">Provider</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employee.trainings || []).map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{t.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.provider}</TableCell>
                  <TableCell className="text-sm">{t.date}</TableCell>
                  <TableCell className="text-sm">{t.hours}h</TableCell>
                </TableRow>
              ))}
              {(!employee.trainings || employee.trainings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                    No training records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Professional Licenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Professional Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">License Name</TableHead>
                <TableHead className="text-xs">License Number</TableHead>
                <TableHead className="text-xs">Expiry Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employee.licenses || []).map((lic, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{lic.name}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{lic.number}</TableCell>
                  <TableCell className="text-sm">
                    {lic.expiry_date === "Lifetime" ? "Lifetime" : lic.expiry_date}
                  </TableCell>
                  <TableCell>
                    {lic.expiry_date === "Lifetime" ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-[11px]" variant="outline">Active</Badge>
                    ) : isExpired(lic.expiry_date) ? (
                      <Badge variant="destructive" className="text-[11px]">Expired</Badge>
                    ) : isExpiringSoon(lic.expiry_date) ? (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]" variant="outline">Expiring Soon</Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-[11px]" variant="outline">Valid</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!employee.licenses || employee.licenses.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                    No professional licenses on file.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}