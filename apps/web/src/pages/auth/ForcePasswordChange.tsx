import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Session expired. Please log in again.");
      }

      // Update password and clear the must_change_password metadata flag
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { must_change_password: false }
      });

      if (updateError) throw updateError;

      // Sync updated password to user_profiles table
      await supabase.from("user_profiles").update({ temp_password: password }).eq("id", user.id);

      // Trigger email authentication / verification link
      if (user.email) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: user.email,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        });
        if (otpError) {
          console.warn("Error sending verification OTP link:", otpError);
          toast.error("Could not send verification email: " + otpError.message);
        }
      }

      toast.success("Password updated! Please check your email inbox to complete authentication.");
      
      // Navigate to email verification pending screen
      navigate("/verify-email");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0C005F] to-[#1900C5]"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md py-12 px-8 flex flex-col relative overflow-hidden">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/assets/ub-hris-logo.png" 
            alt="University of Bohol HRIS Logo" 
            className="h-16 object-contain"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300x80?text=UB+HRIS+Logo";
            }}
          />
        </div>

        {/* Header Icon */}
        <div className="w-16 h-16 bg-blue-50 text-[#0C005F] rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8" />
        </div>

        <div className="w-full mx-auto space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-800">Change Your Password</h2>
            <p className="text-sm text-slate-500">
              For security, you must update your temporary password before accessing your account.
            </p>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4">
            <div className="space-y-1.5 relative">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="rounded-md border-slate-300 focus-visible:ring-[#0C005F] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0C005F] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="rounded-md border-slate-300 focus-visible:ring-[#0C005F] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0C005F] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
               <Button 
                 className="w-full bg-gradient-to-r from-[#0C005F] to-[#1900C5] text-white hover:opacity-90 transition-opacity rounded-md py-6 text-sm font-semibold" 
                 type="submit" 
                 disabled={isLoading}
               >
                 {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Updating Password...
                   </>
                 ) : (
                   "Update Password & Send Verification"
                 )}
               </Button>
            </div>
          </form>

        </div>

        {/* Footer Logo */}
        <div className="flex justify-center mt-12">
          <img 
            src="/assets/ub-footer-logo.png" 
            alt="UB Scholarship Character Service" 
            className="h-8 object-contain opacity-50 block mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
