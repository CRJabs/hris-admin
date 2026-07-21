import { useState, useEffect, useMemo } from "react";
import { 
  SendHorizontal, Search, AlertCircle, 
  Trash2, RefreshCw, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useOrgDepartments } from "@/hooks/useOrgDepartments";
import { format } from "date-fns";
import { toast } from "sonner";

const ANNOUNCEMENT_TYPES = [
  { id: "info", label: "General Information", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "important", label: "Important Advisory", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "urgent", label: "Urgent Notice", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "event", label: "Event / Activity", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "policy", label: "Policy Update", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
];

const BENEFIT_OPTIONS = [
  { key: "thirteenth_month", label: "13th Month Pay" },
  { key: "midyear_bonus", label: "Mid-Year Bonus" },
  { key: "birthday_bonus", label: "Birthday Bonus" },
  { key: "rice_clothing_laundry", label: "Rice / Clothing / Laundry Allowance" },
  { key: "summer_pay", label: "Summer Pay" },
  { key: "service_award", label: "Service Award" },
  { key: "retirement", label: "Retirement Benefit" },
];

const CLASSIFICATION_OPTIONS = ["Teaching", "Non-Teaching"];
const CLASSIFICATION_II_OPTIONS = ["Executive", "Academic Official", "Administrative Official", "Consultant"];
const TENURE_OPTIONS = ["Regular", "Probationary", "Contractual"];

export default function Publish() {
  const { user } = useAuth();
  const { departments } = useOrgDepartments();
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("info");
  
  // Target Mode: 'all' | 'departments' | 'classification' | 'benefits' | 'individual'
  const [targetMode, setTargetMode] = useState("all");
  
  // Target Selection States
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedClassifications, setSelectedClassifications] = useState([]);
  const [selectedClassificationsII, setSelectedClassificationsII] = useState([]);
  const [selectedTenures, setSelectedTenures] = useState([]);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  
  // Employee Data & Eligible Benefits cache
  const [employees, setEmployees] = useState([]);
  const [employeeBenefitsMap, setEmployeeBenefitsMap] = useState({});
  const [isLoadingEmps, setIsLoadingEmps] = useState(true);
  
  // UI States
  const [empSearch, setEmpSearch] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [publishedHistory, setPublishedHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch Employees and Benefits Map
  useEffect(() => {
    async function loadData() {
      setIsLoadingEmps(true);
      try {
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("id, employee_id, first_name, last_name, middle_name, photo_url, department, position, employment_classification, classification_ii, employment_tenure, is_active")
          .eq("is_active", true);
        
        if (empError) throw empError;
        setEmployees(empData || []);

        const { data: benData, error: benError } = await supabase
          .from("employee_benefits")
          .select("employee_id, benefit_key, is_eligible")
          .eq("is_eligible", true);

        if (!benError && benData) {
          const map = {};
          benData.forEach(b => {
            if (!map[b.employee_id]) map[b.employee_id] = new Set();
            map[b.employee_id].add(b.benefit_key);
          });
          setEmployeeBenefitsMap(map);
        }
      } catch (err) {
        console.error("Error loading employees for publishing", err);
      } finally {
        setIsLoadingEmps(false);
      }
    }

    loadData();
    fetchPublishedHistory();
  }, []);

  // Fetch Previously Published Announcements (Only from last 7 days)
  const fetchPublishedHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*")
        .eq("action", "published_announcement")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPublishedHistory(data);
      }
    } catch (err) {
      console.warn("fetchPublishedHistory error", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Delete/Remove Announcement
  const handleDeleteAnnouncement = async (logItem) => {
    setDeletingId(logItem.id);
    try {
      if (logItem.description) {
        await supabase
          .from("notifications")
          .delete()
          .eq("title", logItem.description);
      }

      await supabase
        .from("admin_activity_log")
        .delete()
        .eq("id", logItem.id);

      setPublishedHistory(prev => prev.filter(item => item.id !== logItem.id));
      toast.success("Announcement removed successfully.");
    } catch (err) {
      console.error("Error deleting announcement", err);
      toast.error("Failed to remove announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  // Compute targeted employees dynamically
  const targetedEmployees = useMemo(() => {
    if (targetMode === "all") {
      return employees;
    }
    
    if (targetMode === "departments") {
      if (selectedDepts.length === 0) return [];
      return employees.filter(e => e.department && selectedDepts.includes(e.department));
    }

    if (targetMode === "classification") {
      return employees.filter(e => {
        const matchClass = selectedClassifications.length === 0 || selectedClassifications.includes(e.employment_classification);
        const matchClassII = selectedClassificationsII.length === 0 || selectedClassificationsII.includes(e.classification_ii);
        const matchTenure = selectedTenures.length === 0 || selectedTenures.includes(e.employment_tenure);
        return matchClass && matchClassII && matchTenure;
      });
    }

    if (targetMode === "benefits") {
      if (selectedBenefits.length === 0) return [];
      return employees.filter(e => {
        const empBens = employeeBenefitsMap[e.id];
        if (!empBens) return false;
        return selectedBenefits.some(bKey => empBens.has(bKey));
      });
    }

    if (targetMode === "individual") {
      if (selectedEmployeeIds.length === 0) return [];
      return employees.filter(e => selectedEmployeeIds.includes(e.id));
    }

    return employees;
  }, [
    targetMode, employees, selectedDepts, selectedClassifications, 
    selectedClassificationsII, selectedTenures, selectedBenefits, 
    selectedEmployeeIds, employeeBenefitsMap
  ]);

  // Toggle selection helpers
  const toggleArrayItem = (setter, array, item) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  // Filtered employees for individual mode picker
  const filteredEmployeesForPicker = useMemo(() => {
    if (!empSearch) return employees;
    const s = empSearch.toLowerCase();
    return employees.filter(e => 
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(s) ||
      (e.employee_id && e.employee_id.toLowerCase().includes(s)) ||
      (e.department && e.department.toLowerCase().includes(s))
    );
  }, [employees, empSearch]);

  const handleSelectAllIndividual = () => {
    if (selectedEmployeeIds.length === filteredEmployeesForPicker.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployeesForPicker.map(e => e.id));
    }
  };

  // Publish Handler
  const handlePublish = async () => {
    setInlineError("");

    if (!title.trim()) {
      setInlineError("Please enter an announcement title.");
      return;
    }
    if (!message.trim()) {
      setInlineError("Please enter the announcement message.");
      return;
    }
    if (targetedEmployees.length === 0) {
      setInlineError("No employees matched your target selection criteria. Please adjust your target recipients.");
      return;
    }

    setIsPublishing(true);
    try {
      const timestamp = new Date().toISOString();
      
      // Batch insert into notifications table
      const notificationRows = targetedEmployees.map(emp => ({
        employee_id: emp.id,
        title: title.trim(),
        message: message.trim(),
        type: category,
        is_read: false,
        read: false,
        is_admin_notification: false,
        created_at: timestamp
      }));

      // Supabase insert in chunks of 100 to prevent payload overload
      const chunkSize = 100;
      for (let i = 0; i < notificationRows.length; i += chunkSize) {
        const chunk = notificationRows.slice(i, i + chunkSize);
        const { error: insertErr } = await supabase.from("notifications").insert(chunk);
        if (insertErr) throw insertErr;
      }

      // Log in admin_activity_log
      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: user?.email || "Admin",
        action: "published_announcement",
        description: title.trim(),
        metadata: {
          recipient_count: targetedEmployees.length,
          category,
          target_mode: targetMode,
          message_excerpt: message.trim().substring(0, 150)
        },
        created_at: timestamp
      });

      // Trigger 30-second Toast Notification
      toast.success("ANNOUNCEMENT PUBLISHED SUCCESSFULLY!", {
        description: `"${title.trim()}" was delivered to ${targetedEmployees.length} employee profile system announcements.`,
        duration: 30000,
      });

      // Clear Form & Refresh History
      setTitle("");
      setMessage("");
      fetchPublishedHistory();
    } catch (err) {
      console.error("Publish error", err);
      setInlineError(err.message || "Failed to broadcast announcement. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-4 h-[calc(100vh-1rem)] flex flex-col box-border min-h-[600px] pb-4 animate-in fade-in duration-500">
      {inlineError && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 shrink-0">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs font-bold text-rose-700">{inlineError}</p>
        </div>
      )}

      {/* Main Grid: Left = Single Consolidated Form, Right = Full Height Recent Announcements Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Consolidated Announcement & Audience Selection Card */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0">
          <Card className="border-slate-200 shadow-none rounded-xl overflow-hidden bg-white h-full flex flex-col min-h-0">
            <CardContent className="p-6 space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto">
              
              {/* Category Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Announcement Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 shadow-none">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 shadow-none">
                    {ANNOUNCEMENT_TYPES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <Badge className={`${cat.badgeClass} text-2xs px-2 py-0.5 border shadow-none`}>{cat.label}</Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Title</label>
                <Input 
                  placeholder="write title here"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 text-xs bg-slate-50 border-slate-200 focus:bg-white shadow-none"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Message</label>
                <Textarea 
                  placeholder="write message here"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] text-xs bg-slate-50 border-slate-200 focus:bg-white leading-relaxed resize-none shadow-none"
                />
              </div>

              {/* Recipient Selection Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Target Audience</span>
                  <Badge variant="outline" className="text-2xs font-bold text-[#0C005F] bg-slate-50 border-slate-200 shadow-none">
                    {targetedEmployees.length} Personnel Target
                  </Badge>
                </div>

                {/* Target Mode Selector Tabs */}
                <div className="grid grid-cols-5 gap-2 bg-slate-100/70 p-1.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTargetMode("all")}
                    className={`py-2 px-3 text-2xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      targetMode === "all" ? "bg-white text-[#0C005F] border border-slate-200" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("departments")}
                    className={`py-2 px-3 text-2xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      targetMode === "departments" ? "bg-white text-[#0C005F] border border-slate-200" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("classification")}
                    className={`py-2 px-3 text-2xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      targetMode === "classification" ? "bg-white text-[#0C005F] border border-slate-200" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Classification
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("benefits")}
                    className={`py-2 px-3 text-2xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      targetMode === "benefits" ? "bg-white text-[#0C005F] border border-slate-200" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Benefit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("individual")}
                    className={`py-2 px-3 text-2xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      targetMode === "individual" ? "bg-white text-[#0C005F] border border-slate-200" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Personnel
                  </button>
                </div>

                {/* Mode 1: All Employees */}
                {targetMode === "all" && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-800">Broadcasting to All Active Employees</p>
                    <p className="text-2xs text-slate-400 font-medium">All {employees.length} registered personnel will receive this system announcement.</p>
                  </div>
                )}

                {/* Mode 2: By Department / Office */}
                {targetMode === "departments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Select Target Offices:</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedDepts(selectedDepts.length === departments.length ? [] : departments.map(d => d.name))}
                        className="h-6 text-2xs font-bold text-indigo-600 hover:bg-indigo-50"
                      >
                        {selectedDepts.length === departments.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <ScrollArea className="h-44 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {departments.map(d => (
                          <label 
                            key={d.id || d.name} 
                            className="flex items-center gap-2.5 p-2 bg-white rounded-md border border-slate-200 cursor-pointer hover:border-indigo-200 transition-colors"
                          >
                            <Checkbox 
                              checked={selectedDepts.includes(d.name)}
                              onCheckedChange={() => toggleArrayItem(setSelectedDepts, selectedDepts, d.name)}
                            />
                            <span className="text-xs font-semibold text-slate-800 truncate">{d.name}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Mode 3: By Classification & Tenure */}
                {targetMode === "classification" && (
                  <div className="space-y-4">
                    {/* Class I */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Classification I:</span>
                      <div className="flex flex-wrap gap-2.5">
                        {CLASSIFICATION_OPTIONS.map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 cursor-pointer">
                            <Checkbox 
                              checked={selectedClassifications.includes(opt)}
                              onCheckedChange={() => toggleArrayItem(setSelectedClassifications, selectedClassifications, opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Class II */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Classification II:</span>
                      <div className="flex flex-wrap gap-2.5">
                        {CLASSIFICATION_II_OPTIONS.map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 cursor-pointer">
                            <Checkbox 
                              checked={selectedClassificationsII.includes(opt)}
                              onCheckedChange={() => toggleArrayItem(setSelectedClassificationsII, selectedClassificationsII, opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tenure */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Employment Tenure:</span>
                      <div className="flex flex-wrap gap-2.5">
                        {TENURE_OPTIONS.map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 cursor-pointer">
                            <Checkbox 
                              checked={selectedTenures.includes(opt)}
                              onCheckedChange={() => toggleArrayItem(setSelectedTenures, selectedTenures, opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 4: By Benefit Eligibility */}
                {targetMode === "benefits" && (
                  <div className="space-y-3">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Target Personnel Eligible For:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {BENEFIT_OPTIONS.map(b => (
                        <label 
                          key={b.key} 
                          className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-indigo-50/40 transition-colors"
                        >
                          <Checkbox 
                            checked={selectedBenefits.includes(b.key)}
                            onCheckedChange={() => toggleArrayItem(setSelectedBenefits, selectedBenefits, b.key)}
                          />
                          <span className="text-xs font-bold text-slate-800">{b.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 5: Specific Personnel */}
                {targetMode === "individual" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          placeholder="Search employee name or ID..."
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 shadow-none"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAllIndividual}
                        className="h-9 text-2xs font-bold uppercase tracking-wider border-slate-200 shadow-none"
                      >
                        {selectedEmployeeIds.length === filteredEmployeesForPicker.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>

                    <ScrollArea className="h-48 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                      <div className="space-y-1.5">
                        {filteredEmployeesForPicker.map(emp => (
                          <label 
                            key={emp.id} 
                            className="flex items-center justify-between p-2 bg-white rounded-md border border-slate-200 cursor-pointer hover:border-indigo-200 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox 
                                checked={selectedEmployeeIds.includes(emp.id)}
                                onCheckedChange={() => toggleArrayItem(setSelectedEmployeeIds, selectedEmployeeIds, emp.id)}
                              />
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={emp.photo_url} />
                                <AvatarFallback className="text-2xs bg-slate-100 font-bold">
                                  {emp.first_name?.[0]}{emp.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{emp.last_name}, {emp.first_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{emp.department || "Unassigned"}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">ID: {emp.employee_id}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

              </div>

              {/* Action Bar */}
              <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => { setTitle(""); setMessage(""); setInlineError(""); }}
                  disabled={isPublishing}
                  className="h-10 px-5 text-xs font-bold border-slate-200 rounded-lg shadow-none"
                >
                  Reset Draft
                </Button>

                <Button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="h-10 px-8 bg-[#0C005F] hover:bg-[#1900C5] text-white gap-2 text-xs font-bold uppercase tracking-wider rounded-lg shadow-none"
                >
                  <SendHorizontal className="w-4 h-4" />
                  {isPublishing ? "Broadcasting..." : "Publish Announcement"}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Full Height Recent Announcements Log */}
        <div className="lg:col-span-5 h-full flex flex-col min-h-0">
          <Card className="border-slate-200 shadow-none rounded-xl overflow-hidden bg-white h-full flex flex-col min-h-0">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#0C005F]" />
                <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Announcements</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchPublishedHistory}
                className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 pr-2">
                {publishedHistory.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 opacity-15 mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Recent Announcements</p>
                    <p className="text-2xs text-slate-400 max-w-xs mx-auto">Published announcements within the last 7 days will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {publishedHistory.map(item => {
                      const catType = item.metadata?.category || "info";
                      const catItem = ANNOUNCEMENT_TYPES.find(c => c.id === catType) || ANNOUNCEMENT_TYPES[0];

                      return (
                        <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 group transition-colors hover:border-slate-300">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <Badge className={`${catItem.badgeClass} text-[9px] px-2 py-0.5 border shadow-none`}>
                                {catItem.label}
                              </Badge>
                              <p className="text-xs font-black text-slate-900 truncate">{item.description}</p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === item.id}
                              onClick={() => handleDeleteAnnouncement(item)}
                              className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                              title="Remove Announcement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {item.metadata?.message_excerpt && (
                            <p className="text-2xs text-slate-600 line-clamp-3 leading-relaxed bg-white p-2.5 rounded-md border border-slate-200">
                              "{item.metadata.message_excerpt}"
                            </p>
                          )}

                          <div className="flex items-center justify-end pt-1 text-[10px] text-slate-400 font-medium">
                            <span>{item.created_at ? format(new Date(item.created_at), "MMM d, yyyy h:mm a") : ""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
