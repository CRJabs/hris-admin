import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Building2, Users, Plus, Edit2, Check,
  ChevronDown, Mail as MailIcon, Search, Filter,
  Globe, Phone as PhoneIcon, Smartphone, X, Save,
  Trash2, UserPlus, MapPin, Briefcase, Award, MinusCircle, UserMinus, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EmptyAvatar = () => (
  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
    <Users className="w-1/2 h-1/2 text-slate-300" />
  </div>
);

export default function UniversityChart() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [unitToDelete, setUnitToDelete] = useState(null);
  
  const [orgUnits, setOrgUnits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveApps, setLeaveApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states for the detail pane
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHeadId, setEditHeadId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      setEditName(selectedNode.name);
      setEditHeadId(selectedNode.head_id || "");
      setAssignmentSearch("");
    }
  }, [selectedNode]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [orgRes, empRes, leaveRes] = await Promise.all([
        supabase.from('org_units').select('*').order('created_at', { ascending: true }),
        supabase.from('employees').select('*').order('last_name', { ascending: true }),
        supabase.from('leave_applications').select('*').eq('status', 'approved')
      ]);

      if (orgRes.error) throw orgRes.error;
      if (empRes.error) throw empRes.error;
      if (leaveRes.error) throw leaveRes.error;

      setOrgUnits(orgRes.data || []);
      setEmployees(empRes.data || []);
      setLeaveApps(leaveRes.data || []);
      
      if (!selectedNode && orgRes.data?.length > 0) {
        const root = orgRes.data.find(u => !u.parent_id) || orgRes.data[0];
        setSelectedNode(root);
        if (root) setExpandedNodes(new Set([root.id]));
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      toast.error("Failed to load organizational data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleToggleEdit = () => setIsEditing(!isEditing);

  const handleAddUnit = async (parentId = null) => {
    const parent = orgUnits.find(u => u.id === parentId);
    let level = 0;
    if (parent) {
      const grandParent = orgUnits.find(u => u.id === parent.parent_id);
      level = grandParent ? 2 : 1;
    }

    if (level === 1) {
      const childrenCount = orgUnits.filter(u => u.parent_id === parentId).length;
      if (childrenCount >= 5) {
        toast.error("Maximum limit reached for the President.");
        return;
      }
    }

    if (level >= 3) {
      toast.error("Maximum hierarchy depth (3 tiers) reached.");
      return;
    }

    try {
      const name = level === 0 ? "University President" : (level === 1 ? "New Executive Office" : "New Department");
      const { data, error } = await supabase.from('org_units').insert({
        name,
        parent_id: parentId
      }).select().single();

      if (error) throw error;
      setOrgUnits(prev => [...prev, data]);
      if (parentId) setExpandedNodes(prev => new Set(prev).add(parentId));
      toast.success(`Added ${name}`);
    } catch (err) {
      toast.error("Failed to add organizational unit");
    }
  };

  const handleDeleteUnit = async (unit) => {
    const hasChildren = orgUnits.some(u => u.parent_id === unit.id);
    const hasEmployees = employees.some(e => e.org_unit_id === unit.id);

    if (hasChildren || hasEmployees) {
      toast.error("Cannot delete unit that has sub-units or assigned employees.");
      return;
    }

    setUnitToDelete(unit);
  };

  const confirmDelete = async () => {
    if (!unitToDelete) return;
    try {
      const { error } = await supabase.from('org_units').delete().eq('id', unitToDelete.id);
      if (error) throw error;
      
      const deletedId = unitToDelete.id;
      setOrgUnits(prev => prev.filter(u => u.id !== deletedId));
      if (selectedNode?.id === deletedId) {
        const root = orgUnits.find(u => !u.parent_id && u.id !== deletedId);
        setSelectedNode(root || null);
      }
      toast.success("Unit deleted successfully");
    } catch (err) {
      toast.error("Failed to delete unit");
    } finally {
      setUnitToDelete(null);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedNode) return;
    try {
      const { error } = await supabase
        .from('org_units')
        .update({ 
          name: editName,
          head_id: editHeadId || null
        })
        .eq('id', selectedNode.id);

      if (error) throw error;

      setOrgUnits(prev => prev.map(u => u.id === selectedNode.id ? { ...u, name: editName, head_id: editHeadId } : u));
      setSelectedNode(prev => ({ ...prev, name: editName, head_id: editHeadId }));
      setIsEditingDetail(false);
      toast.success("Department details updated");
    } catch (err) {
      toast.error("Failed to update details");
    }
  };

  const handleAssignEmployee = async (employeeId) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ org_unit_id: selectedNode.id })
        .eq('id', employeeId);

      if (error) throw error;
      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, org_unit_id: selectedNode.id } : e));
      toast.success("Employee assigned");
    } catch (err) {
      toast.error("Failed to assign employee");
    }
  };

  const handleUnassignEmployee = async (employeeId) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ org_unit_id: null })
        .eq('id', employeeId);

      if (error) throw error;
      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, org_unit_id: null } : e));
      toast.success("Employee removed from unit");
    } catch (err) {
      toast.error("Failed to unassign employee");
    }
  };

  const getFullName = (emp) => {
    if (!emp) return "";
    const name = `${emp.first_name}${emp.middle_name ? ' ' + emp.middle_name : ''} ${emp.last_name}`;
    return emp.titles ? `${name}, ${emp.titles}` : name;
  };

  const getStatusColor = (emp) => {
    if (!emp) return "bg-slate-200";
    if (!emp.is_active) return "bg-red-500";
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isOnLeave = leaveApps.some(app => 
      app.employee_id === emp.id && 
      app.start_date <= todayStr && 
      app.end_date >= todayStr
    );
    
    return isOnLeave ? "bg-amber-500" : "bg-green-500";
  };

  const calculateTenure = (dateHired) => {
    if (!dateHired) return "—";
    const start = new Date(dateHired);
    const now = new Date();
    const years = differenceInYears(now, start);
    const months = differenceInMonths(now, start) % 12;
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${months} mo`;
  };

  const departmentEmployees = useMemo(() => {
    if (!selectedNode) return [];
    return employees.filter(e => e.org_unit_id === selectedNode.id);
  }, [employees, selectedNode]);

  const availableEmployees = useMemo(() => {
    if (!assignmentSearch) return [];
    const search = assignmentSearch.toLowerCase();
    return employees.filter(e => 
      e.org_unit_id !== selectedNode?.id && 
      (getFullName(e).toLowerCase().includes(search) || e.employee_id?.toLowerCase().includes(search))
    );
  }, [employees, assignmentSearch, selectedNode]);

  const renderNode = (node, level = 0) => {
    const children = orgUnits.filter(u => u.parent_id === node.id);
    const isSelected = selectedNode?.id === node.id;
    const isExpanded = expandedNodes.has(node.id);
    const head = employees.find(e => e.id === node.head_id);

    return (
      <div key={node.id} className="space-y-4">
        <div className="relative group/node">
          {level > 0 && <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-slate-200" />}
          
          <Card 
            className={cn(
              "border-slate-200 shadow-sm hover:border-[#0C005F]/30 transition-all cursor-pointer relative z-10",
              isSelected && "ring-2 ring-[#0C005F] ring-offset-2 border-transparent"
            )}
            onClick={() => setSelectedNode(node)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {level === 0 ? "Institution" : (level === 1 ? "Executive Office" : "Department")}
                </span>
                <div className="flex items-center gap-2">
                  {isEditing && level > 0 && (
                    <>
                      {level < 2 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={(e) => { e.stopPropagation(); handleAddUnit(node.id); }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUnit(node); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  <div 
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase cursor-pointer hover:bg-blue-50 px-1 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id);
                    }}
                  >
                    <span>{children.length} Units</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarImage src={head?.photo_url} />
                  <AvatarFallback className="bg-slate-50 text-slate-400">
                    <Users className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{node.name || "Untitled"}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{head ? getFullName(head) : "No Head Assigned"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isExpanded && children.length > 0 && (
            <div className="ml-6 border-l-2 border-slate-200 mt-4 pt-2 space-y-4 animate-in slide-in-from-left-2 duration-300">
              {children.map(child => renderNode(child, level + 1))}
              {isEditing && level < 2 && (
                 level === 0 && children.length >= 5 ? null : (
                   <div className="relative pl-6">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-slate-200" />
                     <Button 
                       variant="outline" 
                       className="w-full border-dashed border-2 hover:border-[#0C005F] hover:bg-[#0C005F]/5 text-slate-400 hover:text-[#0C005F] gap-2 h-12 transition-all text-xs"
                       onClick={() => handleAddUnit(node.id)}
                     >
                       <Plus className="w-3.5 h-3.5" />
                       Add {level === 0 ? "Executive Office" : "Department"}
                     </Button>
                   </div>
                 )
              )}
            </div>
          )}
          
          {isExpanded && isEditing && children.length === 0 && level < 2 && (
            <div className="ml-6 border-l-2 border-slate-200 mt-4 pt-2">
               <div className="relative pl-6">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-slate-200" />
                 <Button 
                   variant="outline" 
                   className="w-full border-dashed border-2 hover:border-[#0C005F] hover:bg-[#0C005F]/5 text-slate-400 hover:text-[#0C005F] gap-2 h-12 transition-all text-xs"
                   onClick={() => handleAddUnit(node.id)}
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Add {level === 0 ? "Executive Office" : "Department"}
                 </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedHead = employees.find(e => e.id === selectedNode?.head_id);
  const isExecutiveNode = selectedNode && (!selectedNode.parent_id || orgUnits.find(u => u.id === selectedNode.parent_id && !u.parent_id));

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Compact Search & Filters Header */}
      <div className="px-8 py-3 bg-white border-b flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-sm:hidden max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search units..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant={isEditing ? "default" : "outline"}
            className={cn(
              "h-9 gap-2 transition-all duration-300", 
              isEditing ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-md" : "text-slate-600"
            )}
            onClick={handleToggleEdit}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? "Done Chart" : "Edit Chart"}
          </Button>
          <Button 
            onClick={() => navigate("/employees/add")}
            className="h-9 bg-[#0C005F] hover:bg-[#0C005F]/90 gap-2 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar: Cascading Tree */}
        <div className="w-[450px] border-r bg-white overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-6 relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
                <Building2 className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Loading structure...</p>
              </div>
            ) : orgUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <Building2 className="w-12 h-12 mb-4 opacity-20" />
                <Button onClick={() => handleAddUnit()} className="bg-[#0C005F]">
                  Add First Unit
                </Button>
              </div>
            ) : (
              orgUnits.filter(u => !u.parent_id).map(root => renderNode(root))
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 bg-slate-50/50 overflow-y-auto p-12 custom-scrollbar">
          {!selectedNode ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <Building2 className="w-20 h-20 mb-6 opacity-20" />
              <h2 className="text-xl font-bold">Select a unit</h2>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-12">
              {/* Detail Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <div className="flex-1 mr-8">
                  {isEditingDetail ? (
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-3xl font-bold h-14 bg-white shadow-inner"
                      placeholder="Enter name..."
                    />
                  ) : (
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedNode.name}</h2>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isEditingDetail ? (
                    <>
                      <Button variant="ghost" onClick={() => setIsEditingDetail(false)}>Cancel</Button>
                      <Button onClick={handleSaveDetail} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsEditingDetail(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Details
                    </Button>
                  )}
                </div>
              </div>

              {/* Head of Office Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Head of Office</h3>
                   {isEditingDetail && (
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-medium text-slate-500">Assign Head:</span>
                       <select 
                         className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm outline-none focus:ring-1 focus:ring-indigo-500"
                         value={editHeadId}
                         onChange={(e) => setEditHeadId(e.target.value)}
                       >
                         <option value="">No Head Assigned</option>
                         {employees.map(emp => (
                           <option key={emp.id} value={emp.id}>{getFullName(emp)}</option>
                         ))}
                       </select>
                     </div>
                   )}
                </div>
                <Card className="border-slate-200 shadow-md overflow-hidden bg-white group transition-all duration-300 hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-12">
                      <div className="shrink-0 flex flex-col items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-40 w-40 border-4 border-white shadow-2xl ring-1 ring-slate-100">
                            <AvatarImage src={selectedHead?.photo_url} className="object-cover" />
                            <AvatarFallback className="bg-slate-50">
                              <Users className="w-16 h-16 text-slate-200" />
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute bottom-2 right-2 w-10 h-10 border-4 border-white rounded-full shadow-lg",
                            getStatusColor(selectedHead)
                          )} />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-8 relative">
                        {/* Position Badge moved to TOP */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-4 py-1.5 bg-[#0C005F]/5 text-[#0C005F] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#0C005F]/10">
                            {isExecutiveNode ? selectedNode.name : "Department Head"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</p>
                            <h4 className="text-3xl font-black text-slate-900 leading-tight">
                              {selectedHead ? getFullName(selectedHead) : "Pending Assignment"}
                            </h4>
                            <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">
                              {selectedHead?.position || "Position to be defined"}
                            </p>
                          </div>
                          
                          <div className="space-y-4 pt-4 md:pt-0">
                             {[
                               { label: "Email", icon: MailIcon, value: selectedHead?.contact_email },
                               { label: "Phone", icon: PhoneIcon, value: selectedHead?.contact_phone },
                             ].map((info) => (
                               <div key={info.label} className="flex items-center gap-8 justify-between group/row border-b border-slate-50 pb-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{info.label}</span>
                                 <div className="flex items-center gap-3">
                                   <span className="text-sm font-bold text-slate-900 group-hover/row:text-indigo-600 transition-colors">
                                     {info.value || "—"}
                                   </span>
                                   <info.icon className="w-3.5 h-3.5 text-slate-300" />
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Employees Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {isEditingDetail ? "Manage Assignments" : "Employees Assigned"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">{departmentEmployees.length} Total</span>
                  </div>
                </div>

                {isEditingDetail ? (
                  <div className="space-y-12">
                    {/* Current Members with Unassign */}
                    <div className="space-y-6">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Members</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {departmentEmployees.map(emp => (
                          <Card key={emp.id} className="border-slate-200 bg-white hover:border-red-100 transition-colors group">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={emp.photo_url} />
                                  <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{getFullName(emp)}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-medium">{emp.position}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 gap-2 font-bold text-[10px]"
                                onClick={() => handleUnassignEmployee(emp.id)}
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                Remove
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {departmentEmployees.length === 0 && <p className="text-xs text-slate-400 italic">No employees assigned yet.</p>}
                      </div>
                    </div>

                    {/* Available Employees Picker */}
                    <div className="space-y-6 p-8 bg-slate-100/50 rounded-3xl border border-slate-200 border-dashed">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Assign Available Employees</p>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <Input 
                            placeholder="Search by name or ID..."
                            value={assignmentSearch}
                            onChange={(e) => setAssignmentSearch(e.target.value)}
                            className="pl-9 h-8 text-xs bg-white"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignmentSearch && availableEmployees.map(emp => (
                          <Card key={emp.id} className="border-slate-200 bg-white hover:border-indigo-100 transition-colors group">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={emp.photo_url} />
                                  <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{getFullName(emp)}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-medium">{emp.org_unit_id ? "Currently Assigned" : "Unassigned"}</p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2 font-bold text-[10px]"
                                onClick={() => handleAssignEmployee(emp.id)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Assign
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {!assignmentSearch && (
                          <div className="col-span-full py-8 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start searching to see available employees</p>
                          </div>
                        )}
                        {assignmentSearch && availableEmployees.length === 0 && (
                          <p className="text-xs text-slate-400 italic">No matching employees found.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {departmentEmployees.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                        <Users className="w-12 h-12 mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">No employees assigned</p>
                      </div>
                    ) : (
                      departmentEmployees.map((emp) => (
                        <Card key={emp.id} className="border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                          <CardContent className="p-6 flex gap-6">
                            <div className="shrink-0 space-y-4">
                              <div className="relative">
                                <Avatar className="h-20 w-20 border-2 border-slate-50 shadow-md group-hover:scale-105 transition-transform duration-500">
                                  <AvatarImage src={emp.photo_url} className="object-cover" />
                                  <AvatarFallback className="bg-slate-50">
                                    <Users className="w-8 h-8 text-slate-200" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full animate-pulse shadow-sm",
                                  getStatusColor(emp)
                                )} />
                              </div>
                              <div className="text-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ID: {emp.employee_id}</span>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-4">
                              <div className="space-y-1">
                                <h5 className="font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {getFullName(emp)}
                                </h5>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{emp.position || "Staff"}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                 <div className="space-y-1">
                                   <p className="font-bold text-slate-400 uppercase">Tenure</p>
                                   <p className="font-black text-slate-900">{calculateTenure(emp.date_hired)}</p>
                                 </div>
                                 <div className="space-y-1">
                                   <p className="font-bold text-slate-400 uppercase">Status</p>
                                   <p className="font-black text-indigo-600 truncate">{emp.employment_status || "—"}</p>
                                 </div>
                                 <div className="space-y-1">
                                   <p className="font-bold text-slate-400 uppercase">Class I</p>
                                   <p className="font-black text-slate-900 truncate">{emp.employment_classification || "—"}</p>
                                 </div>
                                 <div className="space-y-1">
                                   <p className="font-bold text-slate-400 uppercase">Class II</p>
                                   <p className="font-black text-slate-900 truncate">{emp.classification_ii || "—"}</p>
                                 </div>
                              </div>

                              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                 <div className="flex items-center gap-3 text-slate-500 overflow-hidden">
                                   <MailIcon className="w-3 h-3 shrink-0" />
                                   <span className="text-[11px] font-medium truncate">{emp.contact_email || "—"}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-slate-500">
                                   <PhoneIcon className="w-3 h-3 shrink-0" />
                                   <span className="text-[11px] font-medium">{emp.contact_phone || "—"}</span>
                                 </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Delete Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{unitToDelete?.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-600/20"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
