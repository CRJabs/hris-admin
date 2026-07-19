import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to send reset email.");
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
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#333]">Reset Password</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {!isSent ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-[#333]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@universityofbohol.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 rounded-lg border-slate-300 text-[#333] focus-visible:ring-[#0C005F]"
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-[#0C005F] to-[#1900C5] text-white hover:opacity-95 transition-opacity rounded-lg h-11 text-sm font-semibold shadow-md" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg text-xs leading-relaxed border border-emerald-200 text-center">
              Check your email <b>{email}</b> for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-[#0C005F] hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
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
