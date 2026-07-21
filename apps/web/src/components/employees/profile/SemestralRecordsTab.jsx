import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, BookOpen, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

export default function SemestralRecordsTab({ 
  employee, 
  semesters: propSemesters, 
  onSemestersChange, 
  isReadOnly = false, 
  isAdminView = false 
}) {
  const [localSemesters, setLocalSemesters] = useState([]);
  const [semLoading, setSemLoading] = useState(false);

  const isTeaching = employee?.employment_classification?.toLowerCase() === "teaching";
  const isManagedExternally = propSemesters !== undefined;
  const list = isManagedExternally ? propSemesters : localSemesters;

  const fetchSemesters = async () => {
    if (isManagedExternally) return;
    if (!employee?.id) return;
    setSemLoading(true);
    try {
      const { data, error } = await supabase
        .from("employee_semesters")
        .select("*")
        .eq("employee_id", employee.id)
        .order("academic_year", { ascending: false });
      if (error) throw error;
      setLocalSemesters(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load semester records.");
    } finally {
      setSemLoading(false);
    }
  };

  useEffect(() => {
    if (isManagedExternally) return;
    fetchSemesters();
  }, [employee?.id, isManagedExternally]);

  const handleAddRow = () => {
    const newRow = {
      id: "temp-" + Date.now() + Math.random(),
      employee_id: employee?.id,
      academic_year: "",
      semester: "1st Semester",
      teaching_load: "",
      is_active: true
    };
    if (isManagedExternally) {
      onSemestersChange([...list, newRow]);
    } else {
      setLocalSemesters([...list, newRow]);
    }
  };

  const handleRowChange = (rowIdOrIndex, field, value) => {
    const updated = list.map((row, index) => {
      const match = row.id ? row.id === rowIdOrIndex : index === rowIdOrIndex;
      if (match) {
        return { ...row, [field]: value };
      }
      return row;
    });
    if (isManagedExternally) {
      onSemestersChange(updated);
    } else {
      setLocalSemesters(updated);
    }
  };

  const handleDeleteRow = (rowIdOrIndex) => {
    const updated = list.filter((row, index) => {
      const match = row.id ? row.id === rowIdOrIndex : index === rowIdOrIndex;
      return !match;
    });
    if (isManagedExternally) {
      onSemestersChange(updated);
    } else {
      setLocalSemesters(updated);
    }
  };

  return (
    <Card className="shadow-none border border-slate-200 rounded-[8px] bg-white w-full">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b bg-slate-50/50">
        <div>
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-700">
            Semester Records
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Historical academic year loads and semester statuses.
          </p>
        </div>
        {isAdminView && !isReadOnly && (
          <Button
            type="button"
            size="sm"
            className="gap-1 h-8 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white font-bold text-xs rounded-[6px] shadow-none px-3 border-none flex items-center justify-center cursor-pointer"
            onClick={handleAddRow}
          >
            <Plus className="w-3.5 h-3.5" /> Add Semester
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        {semLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading semester records...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-2xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                      <th className="py-3 px-4">Academic Year</th>
                      <th className="py-3 px-4">Semester</th>
                      {isTeaching && <th className="py-3 px-4">Load (units)</th>}
                      <th className="py-3 px-4">Status</th>
                      {!isReadOnly && <th className="py-3 px-4 text-right pr-6">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {list.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-700">
                          {isReadOnly ? (
                            row.academic_year
                          ) : (
                            <Input
                              className="h-8.5 text-xs rounded-md bg-white border-slate-200 focus-visible:ring-indigo-500 max-w-[150px]"
                              value={row.academic_year}
                              onChange={(e) => handleRowChange(row.id || index, 'academic_year', e.target.value)}
                              placeholder="e.g. 2026-2027"
                            />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {isReadOnly ? (
                            row.semester
                          ) : (
                            <select
                              className="flex h-8.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
                              value={row.semester}
                              onChange={(e) => handleRowChange(row.id || index, 'semester', e.target.value)}
                            >
                              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                        </td>
                        {isTeaching && (
                          <td className="py-2.5 px-4 text-indigo-600 font-bold">
                            {isReadOnly ? (
                              <span>
                                {row.teaching_load !== null && row.teaching_load !== undefined ? row.teaching_load : "—"} 
                                {row.teaching_load !== null && <span className="text-2xs text-indigo-400 font-normal ml-1">units</span>}
                              </span>
                            ) : (
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                className="h-8.5 text-xs rounded-md bg-white border-slate-200 focus-visible:ring-indigo-500 max-w-[100px]"
                                value={row.teaching_load ?? ""}
                                onChange={(e) => handleRowChange(row.id || index, 'teaching_load', e.target.value)}
                                placeholder="units"
                              />
                            )}
                          </td>
                        )}
                        <td className="py-2.5 px-4">
                          {isReadOnly ? (
                            <Badge
                              className={`rounded-md font-semibold tracking-wide px-2 py-0.5 text-2xs border shadow-none ${
                                row.is_active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                              variant="outline"
                            >
                              {row.is_active ? "Active" : "Inactive"}
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`active-${row.id || index}`}
                                checked={row.is_active}
                                onCheckedChange={(checked) => handleRowChange(row.id || index, 'is_active', !!checked)}
                              />
                              <Label htmlFor={`active-${row.id || index}`} className="text-xs text-slate-600 cursor-pointer select-none">
                                Active
                              </Label>
                            </div>
                          )}
                        </td>
                        {!isReadOnly && (
                          <td className="py-2.5 px-4 text-right pr-6">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRow(row.id || index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md h-8 w-8"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border rounded-xl border-dashed border-slate-200 py-12 text-center text-slate-400 flex flex-col items-center justify-center bg-slate-50/30">
                <BookOpen className="w-10 h-10 mb-2.5 opacity-20 text-slate-500" />
                <p className="text-sm font-semibold text-slate-600">No semester records yet.</p>
                {isAdminView && !isReadOnly ? (
                  <p className="text-xs mt-1 text-slate-400">Click "Add Semester" above to register an academic load.</p>
                ) : (
                  <p className="text-xs mt-1 text-slate-400">This employee does not have any recorded semesters.</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
