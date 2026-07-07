import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Eye, EyeOff, Shield, Edit3, Trash2, Loader2, X, ChevronDown, ChevronRight, Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Define the checkable pages hierarchy based on the existing pages in the project
const PRIVILEGE_PAGES = [
  {
    id: "/accounts",
    title: "Accounts Management",
    description: "Access to system user accounts & privileges (Path: /accounts)",
  },
  {
    id: "/dashboard",
    title: "Dashboard",
    description: "View performance metrics and statistical data (Path: /dashboard)",
  },
  {
    id: "/reports",
    title: "Reports",
    description: "Export custom reports and charts (Path: /reports)",
  },
  {
    id: "/company",
    title: "University Chart",
    description: "View the organizational hierarchical structures (Path: /company)",
  },
  {
    id: "/approvals",
    title: "Pending Approvals",
    description: "Manage approval workflows (Updates, Registrations, Leaves) (Path: /approvals)",
    subpages: [
      { id: "/approvals/updates", title: "Profile Updates", description: "Path: /approvals/updates" },
      { id: "/approvals/registrations", title: "New Registrations", description: "Path: /approvals/registrations" },
      { id: "/approvals/leaves", title: "Leave Applications", description: "Path: /approvals/leaves" },
    ]
  },
  {
    id: "/employees",
    title: "Employees",
    description: "Manage workforce masterlist and onboarding (Path: /employees)",
    subpages: [
      { id: "/employees", title: "View Masterlist", description: "Path: /employees" },
      { id: "/employees/add", title: "Onboarding", description: "Path: /employees/add" },
    ]
  },
  {
    id: "/leaves/assign",
    title: "Leaves",
    description: "Manage leave credits allocation (Path: /leaves/assign)",
  },
  {
    id: "/activity",
    title: "Activity History",
    description: "Monitor system audit log and deleted records (Path: /activity)",
    subpages: [
      { id: "/activity", title: "Activity", description: "Path: /activity" },
      { id: "/activity/bin", title: "Bin", description: "Path: /activity/bin" },
    ]
  },
  {
    id: "/settings",
    title: "Settings",
    description: "Manage global system configurations (Path: /settings)",
  }
];

export default function AccountsManagement() {
  const { user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const activeSubTab = location.pathname === "/accounts/employee" ? "employee" : "admin";

  // Visibility states for individual rows
  const [visibleEmails, setVisibleEmails] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [privilegesModalOpen, setPrivilegesModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected account for editing/privileges/deletion
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [customRole, setCustomRole] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Privileges checkboxes state
  const [checkedPrivileges, setCheckedPrivileges] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    "/approvals": true,
    "/employees": true,
    "/activity": true,
  });

  // Fetch all accounts from user_profiles table
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const adminAccounts = useMemo(() => {
    return accounts.filter(acc => acc.role?.toLowerCase() !== "employee");
  }, [accounts]);

  const employeeAccounts = useMemo(() => {
    return accounts.filter(acc => acc.role?.toLowerCase() === "employee");
  }, [accounts]);

  // List of unique roles currently used in the DB to populate the dropdown
  const getDropdownRoles = () => {
    const rolesSet = new Set(["ADMIN"]);
    adminAccounts.forEach(acc => {
      if (acc.role) {
        rolesSet.add(acc.role.toUpperCase());
      }
    });
    return Array.from(rolesSet);
  };

  // Toggle eye icons
  const toggleEmailVisibility = (id) => {
    setVisibleEmails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Checkbox functions for privileges modal
  const handleParentToggle = (parentId, subpageIds = []) => {
    const isParentChecked = checkedPrivileges.includes(parentId);
    let newChecked = [...checkedPrivileges];

    if (isParentChecked) {
      // Uncheck parent and all subpages
      newChecked = newChecked.filter(id => id !== parentId && !subpageIds.includes(id));
    } else {
      // Check parent and all subpages
      newChecked = Array.from(new Set([...newChecked, parentId, ...subpageIds]));
    }
    setCheckedPrivileges(newChecked);
  };

  const handleChildToggle = (parentId, childId, siblingIds = []) => {
    const isChildChecked = checkedPrivileges.includes(childId);
    let newChecked = [...checkedPrivileges];

    if (isChildChecked) {
      // Uncheck child
      newChecked = newChecked.filter(id => id !== childId);

      // If all siblings and the child are now unchecked, uncheck the parent as well
      const anySiblingChecked = siblingIds.some(id => id !== childId && newChecked.includes(id));
      if (!anySiblingChecked) {
        newChecked = newChecked.filter(id => id !== parentId);
      }
    } else {
      // Check child and ensure parent is also checked
      newChecked = Array.from(new Set([...newChecked, childId, parentId]));
    }
    setCheckedPrivileges(newChecked);
  };

  const handleSingleToggle = (pageId) => {
    const isChecked = checkedPrivileges.includes(pageId);
    if (isChecked) {
      setCheckedPrivileges(prev => prev.filter(id => id !== pageId));
    } else {
      setCheckedPrivileges(prev => [...prev, pageId]);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and Password are required.");
      return;
    }

    const finalRole = activeSubTab === "employee" ? "employee" : (isCreatingRole ? customRole.trim().toUpperCase() : role.toUpperCase());
    if (!finalRole) {
      toast.error("Account role/category is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // 1. Create user via serverless function
      const createRes = await fetch('/api/create-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) throw new Error(createData.error || 'Failed to create auth user');

      const newUserId = createData.user.id;

      // 2. Insert user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: newUserId,
          email: email.trim(),
          role: finalRole.toLowerCase(),
          temp_password: password,
          privileges: []
        });

      if (profileError) throw profileError;

      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: currentUser?.email || "System Admin",
        action: "admin_added_employee",
        description: `Created new web account for ${email.trim()} with role ${finalRole}`,
      });

      toast.success("Web account created successfully!");
      setAddModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      console.error("Error creating web account:", err);
      toast.error(err.message || "Failed to create web account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Account Form Open
  const openEditModal = (account) => {
    setSelectedAccount(account);
    setEmail(account.email || "");
    setPassword(account.temp_password || "");
    setRole(account.role ? account.role.toUpperCase() : (activeSubTab === "employee" ? "EMPLOYEE" : "ADMIN"));
    setCustomRole("");
    setIsCreatingRole(false);
    setEditModalOpen(true);
  };

  const handleEditAccount = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const finalRole = selectedAccount?.role?.toLowerCase() === "employee" ? "employee" : (isCreatingRole ? customRole.trim().toUpperCase() : role.toUpperCase());
    if (!finalRole) {
      toast.error("Account role/category is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Update Auth details if changed
      const updateData = {};
      if (email.trim() !== selectedAccount.email) updateData.email = email.trim();
      if (password !== selectedAccount.temp_password) updateData.password = password;
      updateData.user_metadata = { role: finalRole.toLowerCase() };

      const updateRes = await fetch('/api/update-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ userId: selectedAccount.id, updateData }),
      });
      const updateResult = await updateRes.json();
      if (!updateRes.ok || !updateResult.success) throw new Error(updateResult.error || 'Failed to update auth user');

      // Update profile in DB
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          email: email.trim(),
          role: finalRole.toLowerCase(),
          temp_password: password
        })
        .eq("id", selectedAccount.id);

      if (profileError) throw profileError;

      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: currentUser?.email || "System Admin",
        action: "admin_edited_employee",
        description: `Updated web account for ${email.trim()} (Role: ${finalRole})`,
      });

      toast.success("Web account updated successfully!");
      setEditModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      console.error("Error editing web account:", err);
      toast.error(err.message || "Failed to update web account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // 1. Delete from profiles table first
      const { error: profileError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", selectedAccount.id);

      if (profileError) throw profileError;

      // 2. Delete from auth users via serverless function
      const deleteRes = await fetch('/api/delete-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ userId: selectedAccount.id }),
      });
      const deleteResult = await deleteRes.json();
      if (!deleteRes.ok || !deleteResult.success) throw new Error(deleteResult.error || 'Failed to delete auth user');

      await supabase.from("admin_activity_log").insert({
        actor_type: "admin",
        actor_name: currentUser?.email || "System Admin",
        action: "admin_toggled_employee_status",
        description: `Deleted web account for ${selectedAccount.email}`,
      });

      toast.success("Web account deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Privileges Modal
  const openPrivilegesModal = (account) => {
    setSelectedAccount(account);
    const savedPrivs = Array.isArray(account.privileges) ? account.privileges : [];
    setCheckedPrivileges(savedPrivs);
    setPrivilegesModalOpen(true);
  };

  // Save Privileges
  const handleSavePrivileges = async () => {
    if (!selectedAccount) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ privileges: checkedPrivileges })
        .eq("id", selectedAccount.id);

      if (error) throw error;

      toast.success(`Privileges updated for ${selectedAccount.email}`);
      setPrivilegesModalOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (err) {
      console.error("Error saving privileges:", err);
      toast.error("Failed to update privileges.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRole("ADMIN");
    setCustomRole("");
    setIsCreatingRole(false);
    setSelectedAccount(null);
  };

  // Search filter
  const filteredAccounts = useMemo(() => {
    const targetList = activeSubTab === "employee" ? employeeAccounts : adminAccounts;
    const q = searchQuery.toLowerCase();
    return targetList.filter(acc => {
      const matchesEmail = acc.email?.toLowerCase().includes(q);
      const matchesRole = acc.role?.toLowerCase().includes(q);
      return matchesEmail || matchesRole;
    });
  }, [activeSubTab, adminAccounts, employeeAccounts, searchQuery]);

  const getRoleBadgeColor = (roleStr) => {
    const r = roleStr?.toUpperCase() || "";
    if (r === "ADMIN") return "bg-red-50 text-red-600 border-red-200";
    if (r === "ATTENDANCE") return "bg-amber-50 text-amber-600 border-amber-200";
    if (r === "REGISTRATION") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (r === "NSSG") return "bg-slate-100 text-slate-600 border-slate-200";
    if (r === "PUBLISHING") return "bg-purple-50 text-purple-600 border-purple-200";
    return "bg-blue-50 text-blue-600 border-blue-200";
  };

  const maskString = (str) => {
    return "•".repeat(12);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Controls header */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={activeSubTab === "employee" ? "Search by email address..." : "Search by email address or role..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-slate-200 bg-white shadow-sm focus-visible:ring-[#0C005F] focus-visible:border-[#0C005F]"
            />
          </div>
          {activeSubTab !== "employee" && (
            <Button
              onClick={() => {
                resetForm();
                setRole("ADMIN");
                setAddModalOpen(true);
              }}
              className="bg-[#0C005F] hover:bg-[#1900C5] text-white font-semibold rounded-full px-5 py-2.5 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          )}
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0C005F]" />
              <p className="text-sm font-medium">Loading user profiles...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-25" />
              <p className="text-sm font-medium">
                {activeSubTab === "employee" ? "No employee accounts found." : "No admin or staff accounts found."}
              </p>
              {searchQuery && <p className="text-xs mt-1">Try refining your search query.</p>}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Password</th>
                  <th className="py-4 px-6">Account Type</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAccounts.map((account) => {
                  const isEmailVisible = visibleEmails[account.id];
                  const isPasswordVisible = visiblePasswords[account.id];

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/55 transition-colors group">
                      <td className="py-4.5 px-6 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{isEmailVisible ? account.email : maskString(account.email)}</span>
                          <button
                            onClick={() => toggleEmailVisibility(account.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                            title={isEmailVisible ? "Hide Email" : "Show Email"}
                          >
                            {isEmailVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4.5 px-6 font-mono text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>{isPasswordVisible ? account.temp_password || "None set" : maskString(account.temp_password)}</span>
                          <button
                            onClick={() => togglePasswordVisibility(account.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                            title={isPasswordVisible ? "Hide Password" : "Show Password"}
                          >
                            {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <Badge
                          className={`rounded-md font-semibold tracking-wide uppercase px-2 py-0.5 text-[10px] border shadow-none ${getRoleBadgeColor(account.role)}`}
                        >
                          {account.role || "ADMIN"}
                        </Badge>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">

                          {/* Privileges button */}
                          {activeSubTab !== "employee" && (
                            <Button
                              onClick={() => openPrivilegesModal(account)}
                              variant="ghost"
                              className="text-slate-600 hover:text-[#0C005F] hover:bg-slate-100 rounded-md py-1.5 px-2.5 h-auto text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Privileges
                            </Button>
                          )}

                          {/* Edit button */}
                          <Button
                            onClick={() => openEditModal(account)}
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-[#0C005F] hover:bg-slate-100 rounded-md w-8.5 h-8.5"
                            title="Edit Account"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>

                          {/* Delete button */}
                          <Button
                            onClick={() => {
                              setSelectedAccount(account);
                              setDeleteDialogOpen(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md w-8.5 h-8.5"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Web Account Modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => {
        setAddModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Add Web Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="name@ub.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="rounded-md border-slate-200 focus-visible:ring-[#0C005F]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</Label>
              <Input
                id="add-password"
                type="text"
                placeholder="Enter temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="rounded-md border-slate-200 focus-visible:ring-[#0C005F]"
              />
            </div>

            {activeSubTab !== "employee" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Type Role</Label>

                {!isCreatingRole ? (
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => {
                        if (e.target.value === "CREATE_NEW") {
                          setIsCreatingRole(true);
                          setCustomRole("");
                        } else {
                          setRole(e.target.value);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full bg-white border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0C005F]/20 focus:border-[#0C005F] transition-all cursor-pointer appearance-none"
                    >
                      {getDropdownRoles().map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="CREATE_NEW">+ CREATE NEW CATEGORY</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter new category name (e.g. ATTENDANCE)"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="rounded-md border-slate-200 focus-visible:ring-[#0C005F]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingRole(false);
                        setRole("ADMIN");
                      }}
                      className="rounded-md border-slate-200"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSubmitting} className="rounded-md">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0C005F] hover:bg-[#1900C5] text-white font-semibold rounded-md px-6 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Web Account Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => {
        setEditModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Edit Web Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAccount} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="name@ub.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="rounded-md border-slate-200 focus-visible:ring-[#0C005F]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</Label>
              <Input
                id="edit-password"
                type="text"
                placeholder="Enter temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="rounded-md border-slate-200 focus-visible:ring-[#0C005F]"
              />
            </div>

            {selectedAccount?.role?.toLowerCase() !== "employee" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Type Role</Label>

                {!isCreatingRole ? (
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => {
                        if (e.target.value === "CREATE_NEW") {
                          setIsCreatingRole(true);
                          setCustomRole("");
                        } else {
                          setRole(e.target.value);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full bg-white border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0C005F]/20 focus:border-[#0C005F] transition-all cursor-pointer appearance-none"
                    >
                      {getDropdownRoles().map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="CREATE_NEW">+ CREATE NEW CATEGORY</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter new category name"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="rounded-md border-slate-200 focus-visible:ring-[#0C005F]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingRole(false);
                        setRole(selectedAccount?.role?.toUpperCase() || "ADMIN");
                      }}
                      className="rounded-md border-slate-200"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSubmitting} className="rounded-md">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0C005F] hover:bg-[#1900C5] text-white font-semibold rounded-md px-6 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Privileges Configuration Modal */}
      <Dialog open={privilegesModalOpen} onOpenChange={setPrivilegesModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] rounded-2xl flex flex-col p-0 overflow-hidden">

          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Account Privileges Configuration</DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Define page navigation and action authorization for:{" "}
              <span className="text-[#0C005F] font-bold">{selectedAccount?.email}</span>
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6 py-2 overflow-y-auto">
            <div className="space-y-3.5 pr-2 py-2">
              {PRIVILEGE_PAGES.map((page) => {
                const isChecked = checkedPrivileges.includes(page.id);
                const hasSubpages = page.subpages && page.subpages.length > 0;
                const isExpanded = expandedSections[page.id];
                const subpageIds = hasSubpages ? page.subpages.map(sp => sp.id) : [];

                return (
                  <div
                    key={page.id}
                    className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white"
                  >
                    {/* Parent Row */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/20 transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="pt-0.5">
                          <Checkbox
                            id={`priv-${page.id}`}
                            checked={isChecked}
                            onCheckedChange={() => {
                              if (hasSubpages) {
                                handleParentToggle(page.id, subpageIds);
                              } else {
                                handleSingleToggle(page.id);
                              }
                            }}
                            className="border-slate-300 focus-visible:ring-[#0C005F] data-[state=checked]:bg-[#0C005F] data-[state=checked]:border-[#0C005F]"
                          />
                        </div>
                        <div className="space-y-0.5 cursor-pointer flex-1" onClick={() => {
                          if (hasSubpages) {
                            handleParentToggle(page.id, subpageIds);
                          } else {
                            handleSingleToggle(page.id);
                          }
                        }}>
                          <label
                            htmlFor={`priv-${page.id}`}
                            className="text-sm font-bold text-slate-800 cursor-pointer block leading-none"
                          >
                            {page.title}
                          </label>
                          <span className="text-xs text-slate-400 block leading-snug">
                            {page.description}
                          </span>
                        </div>
                      </div>

                      {/* Expand indicator for pages with subpages */}
                      {hasSubpages && (
                        <button
                          onClick={() => setExpandedSections(prev => ({ ...prev, [page.id]: !prev[page.id] }))}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none"
                        >
                          {isExpanded ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronRight className="w-4.5 h-4.5" />}
                        </button>
                      )}
                    </div>

                    {/* Subpages Checklist */}
                    {hasSubpages && isExpanded && (
                      <div className="border-t border-slate-50 bg-slate-50/30 p-4 pl-10 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                          Granular Features
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {page.subpages.map((subpage) => {
                            const isSubChecked = checkedPrivileges.includes(subpage.id);
                            return (
                              <div key={subpage.id} className="flex items-center gap-2.5">
                                <Checkbox
                                  id={`priv-${subpage.id}`}
                                  checked={isSubChecked}
                                  onCheckedChange={() => handleChildToggle(page.id, subpage.id, subpageIds)}
                                  className="border-slate-300 focus-visible:ring-[#0C005F] data-[state=checked]:bg-[#0C005F] data-[state=checked]:border-[#0C005F]"
                                />
                                <label
                                  htmlFor={`priv-${subpage.id}`}
                                  className="text-xs font-semibold text-slate-700 cursor-pointer leading-none"
                                >
                                  {subpage.title}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/40">
            <DialogClose asChild>
              <Button variant="ghost" disabled={isSubmitting} className="rounded-md">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSavePrivileges}
              disabled={isSubmitting}
              className="bg-[#0C005F] hover:bg-[#1900C5] text-white font-semibold rounded-md px-6 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Privileges"
              )}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="py-2.5">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete the web account for{" "}
              <span className="font-bold text-slate-800">{selectedAccount?.email}</span>?
            </p>
            <p className="text-xs text-red-500 font-semibold mt-2">
              This action cannot be undone. It will delete the user profile and revoke authentication credentials.
            </p>
          </div>
          <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting} className="rounded-md">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
