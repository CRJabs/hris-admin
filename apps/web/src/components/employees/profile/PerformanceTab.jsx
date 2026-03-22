import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function RatingBadge({ rating }) {
  const color = rating >= 4.5 ? "bg-green-50 text-green-700 border-green-200"
    : rating >= 3.5 ? "bg-blue-50 text-blue-700 border-blue-200"
    : rating >= 2.5 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";

  const label = rating >= 4.5 ? "Outstanding"
    : rating >= 3.5 ? "Exceeds Expectations"
    : rating >= 2.5 ? "Meets Expectations"
    : "Needs Improvement";

  return (
    <Badge variant="outline" className={`text-[11px] ${color}`}>
      {rating}/5.0 — {label}
    </Badge>
  );
}

export default function PerformanceTab({ employee }) {
  const latestRating = employee.performance_reviews?.[0]?.rating;

  return (
    <div className="space-y-6">
      {/* Latest Rating Overview */}
      {latestRating && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Latest Performance Rating</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold text-primary">{latestRating}</span>
                  <span className="text-lg text-muted-foreground">/5.0</span>
                </div>
                <Progress value={(latestRating / 5) * 100} className="mt-3 h-2 w-48" />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(latestRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4" />
            Performance Evaluation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs">Rating</TableHead>
                <TableHead className="text-xs">Remarks</TableHead>
                <TableHead className="text-xs">Reviewed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employee.performance_reviews || []).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.period}</TableCell>
                  <TableCell><RatingBadge rating={r.rating} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-70 truncate">{r.remarks}</TableCell>
                  <TableCell className="text-sm">{r.reviewer}</TableCell>
                </TableRow>
              ))}
              {(!employee.performance_reviews || employee.performance_reviews.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                    No performance reviews on record.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Violations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Violations & Disciplinary Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Action Taken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(employee.violations || []).map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{v.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] ${
                      v.type === "Major" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {v.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.description}</TableCell>
                  <TableCell className="text-sm">{v.action_taken}</TableCell>
                </TableRow>
              ))}
              {(!employee.violations || employee.violations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="text-sm">No violations recorded.</p>
                      <p className="text-xs mt-1">Clean disciplinary record ✓</p>
                    </div>
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