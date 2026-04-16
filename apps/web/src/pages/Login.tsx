import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Loader2, Building2, Eye, EyeOff } from "lucide-react";

// shadcn/ui components (adjust imports if your paths differ)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();
  const { navigateToLogin, user } = useAuth(); // Using your existing context function for now

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Fetch the user's role from the employees table
      const { data: profile, error: profileError } = await supabase
        .from("employees")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.warn("Could not fetch user profile:", profileError);
        // If they don't have a profile yet, you might want to handle that specific case
      }

      toast.success("Successfully logged in!");

      // 3. Update your AuthContext (for now, we'll use your mock function to trigger the state change)
      navigateToLogin();

      // We do not navigate manually here.
      // We will let the useEffect listen for the AuthContext 'user' to populate, 
      // which will happen after the root auth listener fetches the profile from Supabase.

    } catch (error: any) {
      toast.error(error.message || "Failed to log in. Please check your credentials.");
      setIsLoading(false);
    }
  };

  // Listen for the user object to fully populate before routing
  // This prevents the race condition where App.jsx forces us back to /login because user is null
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0C005F] to-[#1900C5]"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl md:h-[700px] flex flex-col md:flex-row overflow-hidden">

        {/* Left Side - Login Form */}
        <div className="flex-1 flex flex-col justify-between p-8 md:p-12 relative">

          {/* Top Logo Container Placeholder */}
          <div className="flex justify-center mb-8">
            {/* The user will place 'ub-hris-logo.png' in the public/assets/ folder */}
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
          <div className="w-full max-w-sm mx-auto space-y-6">
            {/* <h2 className="text-2xl font-bold text-center text-slate-800">Login</h2> */}

            <form onSubmit={handleLogin} className="space-y-4">
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

              <div className="space-y-1.5 relative">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
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

              <div className="pt-2">
                <Button
                  className="w-full bg-gradient-to-r from-[#0C005F] to-[#1900C5] text-white hover:opacity-90 transition-opacity rounded-md py-6 text-sm font-semibold"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link to="/forgot-password" className="text-sm text-[#0C005F] hover:underline opacity-80">
                  forgot password?
                </Link>
              </div>
            </form>
          </div>

          {/* Bottom Logo Container Placeholder */}
          <div className="flex justify-center mt-12">
            {/* The user will place 'ub-footer-logo.png' in the public/assets/ folder */}
            <img
              src="/assets/ub-footer-logo.png"
              alt="UB Scholarship Character Service"
              className="h-8 object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/250x40?text=Secondary+Logo+Placeholder";
              }}
            />
          </div>
        </div>

        {/* Right Side - Image Showcase */}
        <div className="hidden md:block md:w-1/2 bg-slate-100 relative p-4">
          <div className="w-full h-full rounded-xl overflow-hidden relative">
            {/* The user will place 'login-building-bg.jpg' in the public/assets/ folder */}
            <img
              src="/assets/login-building-bg.jpg"
              alt="UB Campus Building"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1470&auto=format&fit=crop";
              }}
            />
            {/* A subtle blue overlay to mimic the image's tint, if the raw image doesn't have it */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C005F]/35 to-[#1900C5]/55"></div>
          </div>
        </div>

      </div>
    </div>
  );
}