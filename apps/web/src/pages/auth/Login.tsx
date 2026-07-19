import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [inlineHint, setInlineHint] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInlineError("");
    setInlineHint("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.warn("Could not fetch user profile:", profileError);
      }

      if (authData.user.user_metadata?.must_change_password) {
        toast.info("First login detected. Please change your password.");
        navigate("/force-password-change");
        return;
      }

      toast.success("Successfully logged in!");
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const code = err?.code;
      const message = err?.message || "";

      if (code === "email_not_confirmed") {
        toast.error("Please verify your email before logging in.");
        toast.info("Check your inbox (and spam folder) for the verification link.");
        setInlineError("Your email is not verified yet.");
        setInlineHint("Open your verification email, then return and sign in.");
      } else if (code === "invalid_credentials") {
        toast.error("Invalid email or password.");
        toast.info("Double-check your credentials or use 'forgot password?'.");
        setInlineError("Invalid email or password.");
        setInlineHint("Check your credentials or reset your password.");
      } else if (message.toLowerCase().includes("network")) {
        toast.error("Network error while signing in.");
        toast.info("Please check your internet connection and try again.");
        setInlineError("Network error while signing in.");
        setInlineHint("Check your internet connection and retry.");
      } else {
        toast.error("Unable to log in right now.");
        toast.info(message || "Please try again in a few moments.");
        setInlineError("Unable to log in right now.");
        setInlineHint(message || "Please try again in a few moments.");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.must_change_password) {
        navigate("/force-password-change");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  return (
    <div
      className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 md:p-8"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* Left Side - Login Form */}
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#333] tracking-tight">Sign In</h1>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-[#333]">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@universityofbohol.edu.ph"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (inlineError) {
                        setInlineError("");
                        setInlineHint("");
                      }
                    }}
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 rounded-lg border-slate-300 text-[#333] focus-visible:ring-[#0C005F] focus-visible:border-[#0C005F]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-[#333]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (inlineError) {
                        setInlineError("");
                        setInlineHint("");
                      }
                    }}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11 rounded-lg border-slate-300 text-[#333] focus-visible:ring-[#0C005F] focus-visible:border-[#0C005F]"
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

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-slate-300 data-[state=checked]:bg-[#0C005F] data-[state=checked]:border-[#0C005F]"
                  />
                  <label htmlFor="remember" className="text-xs text-[#333] cursor-pointer font-medium">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-xs text-[#0C005F] font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {inlineError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-left">
                  <p className="text-xs font-semibold text-red-700">{inlineError}</p>
                  {inlineHint && <p className="mt-0.5 text-xs text-red-600">{inlineHint}</p>}
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
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center pt-2 text-xs text-slate-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-[#0C005F] font-bold hover:underline">
                  Register here!
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Picture Block without text or blue border */}
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