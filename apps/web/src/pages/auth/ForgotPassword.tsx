import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      const err = error as Error;
      setErrorMsg(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 md:p-8"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-between py-6 px-2 md:px-6 space-y-8">
          
          {/* Logo */}
          <div>
            <img 
              src="/assets/ub-hris-logo.png" 
              alt="University of Bohol HRIS Logo" 
              className="h-12 md:h-16 object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/300x80?text=UB+HRIS+Logo";
              }}
            />
          </div>

          {/* Form Content */}
          <div className="w-full max-w-md space-y-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#333] tracking-tight">Reset Password</h1>
            
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

                {errorMsg && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 flex items-start gap-3 text-left animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-700">{errorMsg}</p>
                  </div>
                )}

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
        </div>

        {/* Right Side - Picture Block */}
        <div className="hidden md:flex w-full md:w-1/2 lg:w-7/12 h-[680px] lg:h-[720px] rounded-3xl overflow-hidden relative shadow-2xl">
          <img
            src="/assets/login-building-bg.jpg"
            alt="UB Campus Building"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1470&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0C005F]/85 via-[#0C005F]/55 to-[#1900C5]/45 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C005F]/70 via-transparent to-transparent"></div>
        </div>

      </div>
    </div>
  );
}
