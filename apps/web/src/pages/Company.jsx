import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Globe, Phone as PhoneIcon, Smartphone, X, Save, Upload,
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

const UB_LOGO = supabase.storage.from('department-logos').getPublicUrl('ub.png').data.publicUrl;

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
  const [editHeads, setEditHeads] = useState([]);
  const [headAssignmentSearch, setHeadAssignmentSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      setEditName(selectedNode.name);
      setEditHeadId(selectedNode.head_id || "");
      
      const isExec = selectedNode && (!selectedNode.parent_id || orgUnits.some(u => u.id === selectedNode.parent_id && !u.parent_id));
      const initialHeads = selectedNode.heads && selectedNode.heads.length > 0
        ? selectedNode.heads
        : selectedNode.head_id
        ? [{ employee_id: selectedNode.head_id, title: isExec ? selectedNode.name : "Department Head" }]
        : [];
      setEditHeads(initialHeads);

      setAssignmentSearch("");
      setHeadAssignmentSearch("");
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
      setLeaveApps(leaveRes.data || []);

      setEmployees(empRes.data || []);
      
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
      const getVisualLevel = (node) => {
        if (!node) return 0;
        const isL0 = !node.parent_id || node.name?.toLowerCase().includes("departments");
        if (isL0) return 0;
        const parentNode = orgUnits.find(u => u.id === node.parent_id);
        if (!parentNode) return 1;
        const isParentL0 = !parentNode.parent_id || parentNode.name?.toLowerCase().includes("departments");
        return isParentL0 ? 1 : 2;
      };
      level = getVisualLevel(parent) + 1;
    }

    // No child limits are enforced. Anyone can add sub-units.

    // Constrain to strict 2-tier depth (Parent Tree -> Sub-units/Departments only)
    if (level >= 2) {
      toast.error("Maximum hierarchy depth reached.");
      return;
    }

    try {
      const isDept = parent && (() => {
        let current = parent;
        while (current) {
          if (current.name?.toLowerCase().includes('academic')) return true;
          current = orgUnits.find(u => u.id === current.parent_id);
        }
        return false;
      })();
      const name = level === 0 ? "University President" : (isDept ? "New Department" : "New Executive Office");
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

  const isAcademicBranch = useCallback((nodeId) => {
    if (!nodeId) return false;
    const node = orgUnits.find(u => u.id === nodeId);
    if (!node) return false;
    if (node.name?.toLowerCase().includes("academic departments")) return true;
    let current = node;
    while (current && current.parent_id) {
      const parent = orgUnits.find(u => u.id === current.parent_id);
      if (!parent) break;
      if (parent.name?.toLowerCase().includes("academic departments")) return true;
      current = parent;
    }
    return false;
  }, [orgUnits]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedNode.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log("Uploading to department-logos:", filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('department-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase Upload Error Details:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('department-logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('org_units')
        .update({ logo_url: publicUrl })
        .eq('id', selectedNode.id);

      if (updateError) throw updateError;

      setOrgUnits(prev => prev.map(u => u.id === selectedNode.id ? { ...u, logo_url: publicUrl } : u));
      setSelectedNode(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success("Department logo updated");
    } catch (err) {
      console.error("Logo Upload Error:", err);
      toast.error("Failed to upload logo: " + (err.message || "Unknown error"));
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
      const primaryHeadId = editHeads[0]?.employee_id || null;

      const { error } = await supabase
        .from('org_units')
        .update({ 
          name: editName,
          head_id: primaryHeadId,
          heads: editHeads
        })
        .eq('id', selectedNode.id);

      if (error) throw error;

      // Update employee records for each assigned head of office
      for (const head of editHeads) {
        if (head.employee_id) {
          const { error: empUpdateError } = await supabase
            .from('employees')
            .update({
              position: head.title || "Head of Office",
              department: editName,
              org_unit_id: selectedNode.id
            })
            .eq('id', head.employee_id);
            
          if (empUpdateError) {
            console.error("Error updating employee record for head:", empUpdateError);
          }
        }
      }

      // Update the local employees state so the UI reflects changes immediately
      setEmployees(prev => prev.map(e => {
        const matchingHead = editHeads.find(h => h.employee_id === e.id);
        if (matchingHead) {
          return {
            ...e,
            position: matchingHead.title || "Head of Office",
            department: editName,
            org_unit_id: selectedNode.id
          };
        }
        return e;
      }));

      setOrgUnits(prev => prev.map(u => u.id === selectedNode.id ? { ...u, name: editName, head_id: primaryHeadId, heads: editHeads } : u));
      setSelectedNode(prev => ({ ...prev, name: editName, head_id: primaryHeadId, heads: editHeads }));
      setIsEditingDetail(false);
      toast.success("Department details updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update details");
    }
  };

  const handleAppointHead = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const isExec = selectedNode && (!selectedNode.parent_id || orgUnits.some(u => u.id === selectedNode.parent_id && !u.parent_id));
    const title = emp.position || (isExec ? selectedNode.name : "Department Head");

    setEditHeads(prev => {
      if (prev.some(h => h.employee_id === employeeId)) return prev;
      return [...prev, { employee_id: employeeId, title }];
    });
    toast.success(`${getFullName(emp)} added to appointed list.`);
  };

  const handleRemoveHead = (employeeId) => {
    setEditHeads(prev => prev.filter(h => h.employee_id !== employeeId));
    toast.success("Removed head from appointed list.");
  };

  const handleUpdateHeadTitle = (employeeId, newTitle) => {
    setEditHeads(prev => prev.map(h => h.employee_id === employeeId ? { ...h, title: newTitle } : h));
  };

  const handleAssignEmployee = async (employeeId) => {
    try {
      // Determine department name: use the selected node's name if it's a
      // direct child of Academic/Non-Academic, otherwise walk up the tree.
      const getDeptName = () => {
        let current = selectedNode;
        while (current) {
          const parent = orgUnits.find(u => u.id === current.parent_id);
          if (!parent) return null;
          if (
            parent.name?.toLowerCase().includes('academic departments') ||
            parent.name?.toLowerCase().includes('non-academic departments')
          ) {
            return current.name;
          }
          current = parent;
        }
        return null;
      };
      const deptName = getDeptName();

      const updatePayload = { org_unit_id: selectedNode.id };
      if (deptName) updatePayload.department = deptName;

      const { error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', employeeId);

      if (error) throw error;
      setEmployees(prev => prev.map(e =>
        e.id === employeeId ? { ...e, ...updatePayload } : e
      ));
      toast.success("Employee assigned");
    } catch (err) {
      toast.error("Failed to assign employee");
    }
  };

  const handleUnassignEmployee = async (employeeId) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ org_unit_id: null, department: null })
        .eq('id', employeeId);

      if (error) throw error;
      setEmployees(prev => prev.map(e =>
        e.id === employeeId ? { ...e, org_unit_id: null, department: null } : e
      ));
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
    if (!emp.is_active) return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]";
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isOnLeave = leaveApps.some(app => 
      app.employee_id === emp.id && 
      app.start_date <= todayStr && 
      app.end_date >= todayStr
    );
    
    return isOnLeave 
      ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" 
      : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
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

  const headsList = useMemo(() => {
    if (selectedNode?.heads && selectedNode.heads.length > 0) {
      return selectedNode.heads;
    }
    if (selectedNode?.head_id) {
      const isExec = selectedNode && (!selectedNode.parent_id || orgUnits.some(u => u.id === selectedNode.parent_id && !u.parent_id));
      return [{ employee_id: selectedNode.head_id, title: isExec ? selectedNode.name : "Department Head" }];
    }
    return [];
  }, [selectedNode, orgUnits]);

  const availableEmployees = useMemo(() => {
    const search = (assignmentSearch || "").toLowerCase();
    const headsIds = headsList.map(h => h.employee_id);
    const filtered = employees.filter(e => 
      !headsIds.includes(e.id) && 
      (getFullName(e).toLowerCase().includes(search) || e.employee_id?.toLowerCase().includes(search))
    );
    
    // Sort so unassigned employees come first
    return filtered.sort((a, b) => {
      if (!a.org_unit_id && b.org_unit_id) return -1;
      if (a.org_unit_id && !b.org_unit_id) return 1;
      return 0;
    });
  }, [employees, assignmentSearch, headsList]);

  const renderNode = (node, level = 0) => {
    const children = orgUnits.filter(u => u.parent_id === node.id && !u.name?.toLowerCase().includes("departments"));
    const isSelected = selectedNode?.id === node.id;
    const isExpanded = expandedNodes.has(node.id);
    const head = employees.find(e => e.id === node.head_id);
    const levelStyles = [
      { 
        border: "border-l-4 border-l-amber-400", 
        bg: "bg-[#0C005F]", 
        text: "text-white", 
        subtext: "text-slate-400",
        label: "Executive",
        labelColor: "text-amber-400"
      },
      { 
        border: "border-l-4 border-l-indigo-500", 
        bg: "bg-white", 
        text: "text-slate-900", 
        subtext: "text-slate-500",
        label: "Executive Office",
        labelColor: "text-indigo-600"
      },
      { 
        border: "border-l-4 border-l-emerald-500", 
        bg: "bg-white", 
        text: "text-slate-900", 
        subtext: "text-slate-500",
        label: "Department",
        labelColor: "text-emerald-600"
      }
    ];

    const isAcademic = node.name?.toLowerCase().includes("academic departments");
    const isNonAcademic = node.name?.toLowerCase().includes("non-academic departments");
    const isSpecialL0 = isAcademic || isNonAcademic;
    // Nodes whose parent is an academic/non-academic hub are departments, not executive offices
    const isUnderAcademicHub = isAcademicBranch(node.id);

    let style = { ...levelStyles[Math.min(level, 2)] };
    // Override level-1 label to "Department" for nodes directly under academic/non-academic hubs
    if (level === 1 && isUnderAcademicHub) {
      style = { ...style, label: "Department" };
    }
    
    // Apply special L0 styles
    if (isSpecialL0) {
      style = { ...levelStyles[0] }; // Start with L0 base
      style.label = "Institutional";
      if (isNonAcademic) {
        style.bg = "bg-gradient-to-br from-rose-600 via-rose-700 to-[#800020]";
        style.text = "text-white";
        style.subtext = "text-white/60";
        style.labelColor = "text-white";
        style.border = "border-l-4 border-l-rose-300";
      } else if (isAcademic) {
        style.bg = "bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500";
        style.text = "text-[#0C005F]";
        style.subtext = "text-[#0C005F]/60";
        style.labelColor = "text-[#0C005F]";
        style.border = "border-l-4 border-l-[#0C005F]";
      }
    }

    return (
      <div key={node.id} className="space-y-4">
        <div className="relative group/node">
          <Card 
            className={cn(
              "shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer relative z-10 overflow-hidden",
              style.bg,
              style.border,
              isSelected ? "ring-2 ring-indigo-500 ring-offset-2 scale-[1.02]" : "border-slate-200"
            )}
            onClick={() => setSelectedNode(node)}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", style.labelColor)}>
                  {style.label}
                </span>
                <div className="flex items-center gap-2">
                  {isEditing && level === 0 && (
                    <div className="flex items-center bg-slate-50 rounded-full px-1 py-0.5 border border-slate-100 shadow-sm">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleAddUnit(node.id); }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUnit(node); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {isEditing && level > 0 && (
                    <div className="flex items-center bg-slate-50 rounded-full px-1 py-0.5 border border-slate-100 shadow-sm">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUnit(node); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {level === 0 && (
                    <div 
                      className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 transition-all bg-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.id);
                      }}
                    >
                      <span>{children.length} Units</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-500", isExpanded ? "rotate-180" : "rotate-0")} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {(isSpecialL0 || !isSpecialL0) && (
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src={isSpecialL0 ? UB_LOGO : (isAcademicBranch(node.id) ? node.logo_url : head?.photo_url)} className="object-cover" />
                      <AvatarFallback className="bg-slate-50 text-slate-400">
                        {isAcademicBranch(node.id) ? <Building2 className="w-6 h-6" /> : <Users className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    {!isSpecialL0 && !isAcademicBranch(node.id) && (
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white", getStatusColor(head))} />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className={cn("text-sm font-black truncate leading-tight", style.text)}>{node.name || "Untitled"}</h4>
                  {!isSpecialL0 && !isAcademicBranch(node.id) && (
                    <p className={cn("text-[11px] font-bold truncate mt-0.5", style.subtext)}>{head ? getFullName(head) : "Position Pending"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
 
          {isExpanded && children.length > 0 && (
            <div className="ml-5 border-l-2 border-slate-100 mt-2 pl-4 space-y-4 animate-in slide-in-from-left-2 duration-300 relative">
              {children.map((child, idx) => (
                <div key={child.id} className="relative">
                  {/* Horizontal Connector */}
                  <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-slate-100" />
                  {/* Vertical line cutter for last child */}
                  {idx === children.length - 1 && (
                    <div className="absolute -left-[18px] top-1/2 bottom-0 w-[4px] bg-white z-10" />
                  )}
                  {renderNode(child, level + 1)}
                </div>
              ))}
              {isEditing && level === 0 && (
                 !isUnderAcademicHub ? (
                   <div className="relative pl-6">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-slate-200" />
                     <Button 
                       variant="outline" 
                       className="w-full border-dashed border-2 hover:border-[#0C005F] hover:bg-[#0C005F]/5 text-slate-400 hover:text-[#0C005F] gap-2 h-12 transition-all text-xs"
                       onClick={() => handleAddUnit(node.id)}
                     >
                       <Plus className="w-3.5 h-3.5" />
                       Add Executive Office
                     </Button>
                   </div>
                 ) : (
                   <div className="relative pl-6">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-slate-200" />
                     <Button 
                       variant="outline" 
                       className="w-full border-dashed border-2 hover:border-[#0C005F] hover:bg-[#0C005F]/5 text-slate-400 hover:text-[#0C005F] gap-2 h-12 transition-all text-xs"
                       onClick={() => handleAddUnit(node.id)}
                     >
                       <Plus className="w-3.5 h-3.5" />
                       Add Department
                     </Button>
                   </div>
                 )
              )}
            </div>
          )}
          
          {isExpanded && isEditing && children.length === 0 && level === 0 && (
            <div className="ml-6 border-l-2 border-slate-200 mt-4 pt-2">
               <div className="relative pl-6">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-slate-200" />
                 <Button 
                   variant="outline" 
                   className="w-full border-dashed border-2 hover:border-[#0C005F] hover:bg-[#0C005F]/5 text-slate-400 hover:text-[#0C005F] gap-2 h-12 transition-all text-xs"
                   onClick={() => handleAddUnit(node.id)}
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Add {!isUnderAcademicHub ? "Executive Office" : "Department"}
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

  // headsList useMemo was moved up to be used in availableEmployees
  
  const isInstitutional = useMemo(() => {
    if (!selectedNode) return false;
    const name = selectedNode.name?.toLowerCase() || "";
    return name.includes("academic departments") || name.includes("non-academic departments");
  }, [selectedNode]);

  return (
    <div className="h-full flex flex-col bg-slate-50/50">

      {/* Mobile hint banner */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs font-medium shrink-0">
        <span>📱 For the best experience, view the University Chart on a desktop.</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar: Cascading Tree — hidden on mobile when detail pane is open */}
        <div className={`${selectedNode ? 'hidden md:flex' : 'flex'} w-full md:w-[450px] border-r bg-white flex-col`}>
          {/* Sidebar Search & Edit Header */}
          <div className="p-4 md:p-6 border-b flex items-center gap-3 bg-slate-50/30">
            <div className="relative flex-[2]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search units..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-9 h-11 bg-white border-slate-200 shadow-sm focus:ring-1 focus:ring-[#0C005F]/20 transition-all"
              />
            </div>
            <Button 
              variant={isEditing ? "default" : "outline"}
              className={cn(
                "flex-1 h-11 gap-2 transition-all duration-300 font-bold", 
                isEditing ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/20" : "text-[#0C005F] border-[#0C005F]/10 hover:bg-[#0C005F]/5"
              )}
              onClick={handleToggleEdit}
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {isEditing ? "Done" : "Edit"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-8 custom-scrollbar">
          <div className="space-y-6 relative min-w-[320px]">
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
              orgUnits
                .filter(u => !u.parent_id || u.name?.toLowerCase().includes("departments"))
                .map(root => renderNode(root))
            )}
          </div>
          </div>
        </div>

        {/* Right Detail Pane — full-width on mobile, flex-1 on desktop */}
        <div className={`${selectedNode ? 'flex' : 'hidden md:flex'} flex-1 bg-white overflow-y-auto custom-scrollbar flex-col`}>
          {/* Mobile back button */}
          {selectedNode && (
            <button
              className="md:hidden flex items-center gap-1 text-xs font-bold text-[#0C005F] px-4 py-3 border-b bg-slate-50 self-start w-full"
              onClick={() => setSelectedNode(null)}
            >
              ← Back to chart
            </button>
          )}
          {!selectedNode ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-slate-100">
                <Building2 className="w-12 h-12 opacity-20 text-indigo-600" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-300">Select an Office</h2>
            </div>
          ) : (
            <div className="p-12 space-y-12">
              {/* Detail Header */}
              <div className="flex items-center justify-between pb-8 border-b-2 border-slate-100 relative">
                <div className="absolute -top-12 -left-12 -right-12 h-32 bg-gradient-to-b from-slate-50 to-white -z-10" />
                <div className="flex-1 mr-8 flex items-center gap-6">
                  {(isInstitutional || isAcademicBranch(selectedNode.id)) && (
                    <div className="relative group/logo">
                      <Avatar className="h-20 w-20 border-2 border-white shadow-xl ring-4 ring-slate-50">
                        <AvatarImage src={isInstitutional ? UB_LOGO : selectedNode.logo_url} className="object-cover" />
                        <AvatarFallback className="bg-slate-50 text-slate-400">
                          <Building2 className="w-8 h-8 opacity-20" />
                        </AvatarFallback>
                      </Avatar>
                      {isEditingDetail && !isInstitutional && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                          <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                        </label>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    {isEditingDetail ? (
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-3xl font-black h-16 bg-white shadow-xl border-indigo-200 focus:ring-4 focus:ring-indigo-100 transition-all"
                        placeholder="Enter office name..."
                      />
                    ) : (
                      <div className="space-y-1">
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{selectedNode.name}</h2>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!isInstitutional && (
                    isEditingDetail ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditingDetail(false)} className="h-11 px-6 font-bold text-slate-500">Cancel</Button>
                        <Button onClick={handleSaveDetail} className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-black shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95">
                          <Save className="w-5 h-5" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setIsEditingDetail(true)}
                        className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-black shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modify Office
                      </Button>
                    )
                  )}
                </div>
              </div>

              {isInstitutional ? (
                <div className="space-y-12 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Sub-Offices</h3>
                      <p className="text-xs text-slate-400 italic">Select an office to view or manage its specific assignments.</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                        {orgUnits.filter(u => u.parent_id === selectedNode.id).length} Active Units
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orgUnits
                      .filter(u => u.parent_id === selectedNode.id)
                      .map(unit => {
                        const head = employees.find(e => e.id === unit.head_id);
                        const unitStaffCount = employees.filter(e => e.org_unit_id === unit.id).length;
                        
                        return (
                          <Card 
                            key={unit.id} 
                            onClick={() => setSelectedNode(unit)}
                            className="group cursor-pointer hover:shadow-2xl transition-all duration-500 border-slate-200 overflow-hidden bg-white hover:-translate-y-2 relative"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-8 space-y-6">
                              <div className="space-y-2">
                                <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight tracking-tight">
                                  {unit.name}
                                </h4>
                              </div>
                              
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                  <AvatarImage src={isAcademicBranch(selectedNode.id) ? unit.logo_url : head?.photo_url} />
                                  <AvatarFallback className="bg-white">
                                    {isAcademicBranch(selectedNode.id) ? <Building2 className="w-5 h-5 text-slate-200" /> : <Users className="w-5 h-5 text-slate-200" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                    {isAcademicBranch(selectedNode.id) ? "Department" : "Head of Office"}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {isAcademicBranch(selectedNode.id) ? unit.name : (head ? getFullName(head) : "Pending")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <Users className="w-4 h-4 text-indigo-400" />
                                  {unitStaffCount} Personnel
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                  View Details →
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    {orgUnits.filter(u => u.parent_id === selectedNode.id).length === 0 && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px]">
                        <Building2 className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">No departments found</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Head of Office Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                         {headsList.length <= 1 ? "Head of Office" : "Heads of Office"}
                       </h3>
                    </div>
                    {(() => {
                      const nodeLevel = !selectedNode?.parent_id ? 0 : 
                                       orgUnits.find(u => u.id === selectedNode.parent_id && !u.parent_id) ? 1 : 2;
                      
                      const cardStyles = [
                        { bg: "bg-[#0C005F]", text: "text-white", subtext: "text-white/60", badge: "bg-amber-400 text-[#0C005F]", border: "border-amber-400/20" },
                        { bg: "bg-white", text: "text-slate-900", subtext: "text-slate-500", badge: "bg-indigo-600 text-white", border: "border-slate-200" },
                        { bg: "bg-white", text: "text-slate-900", subtext: "text-slate-500", badge: "bg-emerald-600 text-white", border: "border-slate-200" }
                      ];
                      const s = cardStyles[nodeLevel];

                      return headsList.length === 0 ? (
                        <Card className={cn("shadow-xl overflow-hidden group transition-all duration-500 hover:shadow-2xl border-2", s.bg, s.border)}>
                          <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-center text-slate-400">
                              <Users className="w-16 h-16 opacity-20" />
                              <div className="text-center md:text-left">
                                <h4 className="text-xl font-bold">No Appointed Heads</h4>
                                <p className="text-sm">Appoint a head of office by editing the details.</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : headsList.length === 1 ? (() => {
                        const head = headsList[0];
                        const emp = employees.find(e => e.id === head.employee_id);
                        return (
                          <Card className={cn("shadow-xl overflow-hidden group transition-all duration-500 hover:shadow-2xl border-2", s.bg, s.border)}>
                            <CardContent className="p-8">
                              <div className="flex flex-col md:flex-row gap-12">
                                <div className="shrink-0 flex flex-col items-center gap-6">
                                  <div className="relative">
                                    <Avatar className="h-40 w-40 border-4 border-white shadow-2xl ring-1 ring-slate-100">
                                      <AvatarImage src={emp?.photo_url} className="object-cover" />
                                      <AvatarFallback className="bg-slate-50">
                                        <Users className="w-16 h-16 text-slate-200" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                      "absolute bottom-2 right-2 w-10 h-10 border-4 border-white rounded-full shadow-lg",
                                      getStatusColor(emp)
                                    )} />
                                  </div>
                                </div>
                                
                                <div className="flex-1 space-y-8 relative">
                                  <div className="flex flex-wrap gap-2">
                                    <span className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg", s.badge)}>
                                      {head.title || (isExecutiveNode ? selectedNode.name : "Department Head")}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-2">
                                      <p className={cn("text-[10px] font-black uppercase tracking-widest", s.subtext)}>Employee Name</p>
                                      <h4 className={cn("text-3xl font-black leading-tight", s.text)}>
                                        {emp ? getFullName(emp) : "Pending Assignment"}
                                      </h4>
                                      <p className={cn("font-bold uppercase tracking-widest text-xs", nodeLevel === 0 ? "text-amber-400" : "text-indigo-600")}>
                                        {emp?.position || "Position Pending"}
                                      </p>
                                    </div>
                                    
                                    <div className="space-y-4 pt-4 md:pt-0">
                                       {[
                                         { label: "Email", icon: MailIcon, value: emp?.contact_email },
                                         { label: "Phone", icon: PhoneIcon, value: emp?.contact_phone },
                                       ].map((info) => (
                                         <div key={info.label} className={cn("flex items-center gap-8 justify-between group/row border-b pb-2", nodeLevel === 0 ? "border-white/10" : "border-slate-50")}>
                                           <span className={cn("text-[10px] font-black uppercase tracking-widest", s.subtext)}>{info.label}</span>
                                           <div className="flex items-center gap-3">
                                             <span className={cn("text-sm font-bold transition-colors", s.text)}>
                                               {info.value || "—"}
                                             </span>
                                             <info.icon className={cn("w-3.5 h-3.5", s.subtext)} />
                                           </div>
                                         </div>
                                       ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })() : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {headsList.map((head, idx) => {
                            const emp = employees.find(e => e.id === head.employee_id);
                            return (
                              <Card key={idx} className={cn("shadow-lg overflow-hidden group transition-all duration-500 hover:shadow-2xl border-2", s.bg, s.border)}>
                                <CardContent className="p-6">
                                  <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="shrink-0 flex flex-col items-center gap-4">
                                      <div className="relative">
                                        <Avatar className="h-28 w-28 border-4 border-white shadow-xl ring-1 ring-slate-100">
                                          <AvatarImage src={emp?.photo_url} className="object-cover" />
                                          <AvatarFallback className="bg-slate-50">
                                            <Users className="w-12 h-12 text-slate-200" />
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                          "absolute bottom-1 right-1 w-7 h-7 border-4 border-white rounded-full shadow-md",
                                          getStatusColor(emp)
                                        )} />
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-4 min-w-0">
                                      <div className="flex flex-wrap gap-2">
                                        <span className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shadow-md truncate max-w-full", s.badge)}>
                                          {head.title || (isExecutiveNode ? selectedNode.name : "Department Head")}
                                        </span>
                                      </div>

                                      <div className="space-y-1">
                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", s.subtext)}>Employee Name</p>
                                        <h4 className={cn("text-xl font-black leading-tight truncate", s.text)}>
                                          {emp ? getFullName(emp) : "Pending Assignment"}
                                        </h4>
                                        <p className={cn("font-bold uppercase tracking-widest text-[10px]", nodeLevel === 0 ? "text-amber-400" : "text-indigo-600")}>
                                          {emp?.position || "Position Pending"}
                                        </p>
                                      </div>
                                      
                                      <div className="space-y-2 pt-2 border-t border-dashed border-slate-100/20">
                                         {[
                                           { label: "Email", icon: MailIcon, value: emp?.contact_email },
                                           { label: "Phone", icon: PhoneIcon, value: emp?.contact_phone },
                                         ].map((info) => (
                                           <div key={info.label} className={cn("flex items-center gap-4 justify-between group/row border-b pb-1 last:border-b-0", nodeLevel === 0 ? "border-white/10" : "border-slate-50")}>
                                             <span className={cn("text-[9px] font-black uppercase tracking-widest", s.subtext)}>{info.label}</span>
                                             <div className="flex items-center gap-2 min-w-0">
                                               <span className={cn("text-xs font-bold transition-colors truncate", s.text)}>
                                                 {info.value || "—"}
                                               </span>
                                               <info.icon className={cn("w-3 h-3 shrink-0", s.subtext)} />
                                             </div>
                                           </div>
                                         ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {isEditingDetail && (
                    <div className="space-y-8 p-8 bg-slate-100/50 rounded-3xl border border-slate-200 border-dashed">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Appointed Leaders & Custom Titles</h4>
                        {editHeads.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No heads appointed. Search and appoint leaders below.</p>
                        ) : (
                          <div className="space-y-4">
                            {editHeads.map((head, idx) => {
                              const emp = employees.find(e => e.id === head.employee_id);
                              return (
                                <div key={head.employee_id || idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={emp?.photo_url} />
                                      <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-900 truncate">{emp ? getFullName(emp) : "Pending"}</p>
                                      <p className="text-[10px] text-slate-500 uppercase truncate">{emp?.position || "Staff"}</p>
                                    </div>
                                  </div>
                                  <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
                                    <div className="flex-1">
                                      <Input 
                                        placeholder="Designated Title (e.g. Dean, Chairperson)"
                                        value={head.title || ""}
                                        onChange={(e) => handleUpdateHeadTitle(head.employee_id, e.target.value)}
                                        className="h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                                      />
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full shrink-0"
                                      onClick={() => handleRemoveHead(head.employee_id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-200" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Search & Appoint Leaders</p>
                            <p className="text-[10px] text-slate-400 font-medium italic">You can appoint multiple heads of office to this unit.</p>
                          </div>
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input 
                              placeholder="Search leaders..."
                              value={headAssignmentSearch}
                              onChange={(e) => setHeadAssignmentSearch(e.target.value)}
                              className="pl-9 h-8 text-xs bg-white"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {employees
                            .filter(emp => {
                              if (!headAssignmentSearch) return true;
                              const term = headAssignmentSearch.toLowerCase();
                              return (
                                emp.first_name?.toLowerCase().includes(term) ||
                                emp.last_name?.toLowerCase().includes(term) ||
                                emp.employee_id?.toLowerCase().includes(term)
                              );
                            })
                            .slice(0, 8).map(emp => {
                              const isCurrentlyHead = editHeads.some(h => h.employee_id === emp.id);
                              
                              return (
                                <Card 
                                  key={emp.id} 
                                  className={cn(
                                    "border-slate-200 bg-white transition-all group",
                                    isCurrentlyHead ? "border-[#0C005F] bg-[#0C005F]/5 shadow-sm" : "hover:border-amber-100 hover:shadow-md"
                                  )}
                                >
                                  <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={emp.photo_url} />
                                        <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-bold text-slate-900">{getFullName(emp)}</p>
                                        <p className={cn(
                                          "text-[10px] uppercase font-bold tracking-tight",
                                          isCurrentlyHead ? "text-[#0C005F]" : "text-slate-400"
                                        )}>
                                          {isCurrentlyHead ? "Appointed" : (emp.position || "Staff")}
                                        </p>
                                      </div>
                                    </div>
                                    {isCurrentlyHead ? (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 px-4 text-red-400 hover:text-red-600 hover:bg-red-50 gap-2 font-black text-[10px] uppercase tracking-wider transition-all"
                                        onClick={() => handleRemoveHead(emp.id)}
                                      >
                                        <UserMinus className="w-4 h-4" />
                                        Remove
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-9 px-4 border-2 border-dashed border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 gap-2 font-black text-[10px] uppercase tracking-wider transition-all"
                                        onClick={() => handleAppointHead(emp.id)}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Appoint
                                      </Button>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

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
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">Assign Available Employees</p>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                           <Button 
                             onClick={() => navigate("/employees/add")}
                             variant="outline"
                             className="h-8 border-[#0C005F]/10 text-[#0C005F] hover:bg-[#0C005F]/5 gap-2 text-[10px] font-bold uppercase tracking-wider"
                           >
                             <Plus className="w-3.5 h-3.5" />
                             Add Employee
                           </Button>
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableEmployees.slice(0, 20).map(emp => {
                          const isAlreadyInThisUnit = emp.org_unit_id === selectedNode?.id;
                          const isAssignedElsewhere = emp.org_unit_id && emp.org_unit_id !== selectedNode?.id;
                          
                          return (
                            <Card 
                              key={emp.id} 
                              className={cn(
                                "border-slate-200 bg-white transition-all group",
                                isAlreadyInThisUnit ? "opacity-40 pointer-events-none bg-slate-50" : 
                                isAssignedElsewhere ? "opacity-60 grayscale-[0.5]" : "hover:border-indigo-100 hover:shadow-md"
                              )}
                            >
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={emp.photo_url} />
                                    <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{getFullName(emp)}</p>
                                    <p className={cn(
                                      "text-[10px] uppercase font-bold tracking-tight",
                                      isAlreadyInThisUnit ? "text-slate-400" :
                                      isAssignedElsewhere ? "text-amber-600" : "text-emerald-600"
                                    )}>
                                      {isAlreadyInThisUnit ? "Currently in this Unit" : 
                                       isAssignedElsewhere ? `Assigned: ${orgUnits.find(u => u.id === emp.org_unit_id)?.name}` : "Available for Assignment"}
                                    </p>
                                  </div>
                                </div>
                                {!isAlreadyInThisUnit && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                      "h-9 px-4 border-2 border-dashed gap-2 font-black text-[10px] uppercase tracking-wider transition-all",
                                      isAssignedElsewhere 
                                        ? "border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400" 
                                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 shadow-sm"
                                    )}
                                    onClick={() => handleAssignEmployee(emp.id)}
                                  >
                                    <Plus className="w-4 h-4" />
                                    {isAssignedElsewhere ? "Transfer" : "Assign Now"}
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                        {availableEmployees.length === 0 && (
                          <p className="text-xs text-slate-400 italic col-span-full py-8 text-center">No matching employees found.</p>
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
                                   <p className="font-black text-slate-900 truncate">{emp.employment_tenure || "—"}</p>
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
                                 <div className="flex items-center gap-3 text-slate-500 mb-2">
                                   <Briefcase className="w-3 h-3 shrink-0" />
                                   <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mr-2">In Service for</span>
                                   <span className="text-[11px] font-black text-slate-900">{calculateTenure(emp.date_hired)}</span>
                                 </div>
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
            </>
          )}
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
