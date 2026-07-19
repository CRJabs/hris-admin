import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/registration`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Registration failed. Please try again.");
      }

      toast.success("Verification email sent!");
      navigate("/verify-email");

    } catch (error: unknown) {
      const err = error as Error;
      console.error("Signup error:", err);
      toast.error(err.message || "Failed to create account.");
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
          <div className="space-y-1 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#333]">Create Account</h2>
            <p className="text-xs text-slate-500">Get started with your Digital 201 Filing</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-[#333]">Password</Label>
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
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#333]">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 rounded-lg border-slate-300 text-[#333] focus-visible:ring-[#0C005F]"
                />
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
                    Creating Account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </div>

            <div className="text-center pt-2 text-xs text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-[#0C005F] font-bold hover:underline">
                Login here
              </Link>
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
