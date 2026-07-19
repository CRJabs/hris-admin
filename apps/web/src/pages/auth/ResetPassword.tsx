import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from("user_profiles").update({ temp_password: password }).eq("id", user.id);
      }

      toast.success("Password successfully updated. You can now log in.");
      navigate("/login");
      
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 md:p-8"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-md py-10 px-8 flex flex-col relative overflow-hidden">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/assets/ub-hris-logo.png" 
            alt="University of Bohol HRIS Logo" 
            className="h-14 object-contain"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300x80?text=UB+HRIS+Logo";
            }}
          />
        </div>

        {/* Content */}
        <div className="w-full mx-auto space-y-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#333]">Set New Password</h2>
            <p className="text-xs text-slate-500">
              Enter and confirm your new password below.
            </p>
          </div>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-[#333]">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 h-11 rounded-lg border-slate-300 text-[#333] focus-visible:ring-[#0C005F]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#333] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-semibold text-[#333]">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 h-11 rounded-lg border-slate-300 text-[#333] focus-visible:ring-[#0C005F]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#333] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                className="w-full bg-gradient-to-r from-[#0C005F] to-[#1900C5] text-white hover:opacity-95 transition-opacity rounded-lg h-11 text-sm font-semibold shadow-md" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>

        </div>

        {/* Footer Logo */}
        <div className="flex justify-center mt-10">
          <img 
            src="/assets/ub-footer-logo.png" 
            alt="UB Secondary Logo" 
            className="h-7 object-contain opacity-70 block mx-auto"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/250x40?text=Secondary+Logo";
            }}
          />
        </div>
      </div>
    </div>
  );
}
