import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

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
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
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
        
        {/* Top Logo Container Placeholder */}
        <div className="flex justify-center mb-8">
          <img 
            src="/assets/ub-hris-logo.png" 
            alt="University of Bohol HRIS Logo" 
            className="h-16 object-contain"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300x80?text=UB+HRIS+Logo+Placeholder";
            }}
          />
        </div>

        {/* Form Area */}
        <div className="w-full mx-auto space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
            <p className="text-sm text-slate-500">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {!isSent ? (
            <form onSubmit={handleReset} className="space-y-6 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="rounded-md border-slate-300 focus-visible:ring-[#0C005F]"
                />
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-[#0C005F] to-[#1900C5] text-white hover:opacity-90 transition-opacity rounded-md py-6 text-sm font-semibold" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm text-center border border-green-200 mt-4">
              Check your email <b>{email}</b> for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/login" className="text-sm text-[#0C005F] hover:underline opacity-80 inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>

        {/* Bottom Logo Container Placeholder */}
        <div className="flex justify-center mt-12">
          <img 
            src="/assets/ub-footer-logo.png" 
            alt="UB Scholarship Character Service" 
            className="h-8 object-contain opacity-50 block mx-auto"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/250x40?text=Secondary+Logo+Placeholder";
            }}
          />
        </div>
      </div>
    </div>
  );
}
