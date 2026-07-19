import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const hasAuthTokenInUrl = 
      window.location.hash.includes("access_token") || 
      window.location.hash.includes("type=") || 
      window.location.search.includes("code=");

    if (hasAuthTokenInUrl) {
      setIsVerified(true);
      toast.success("Email authenticated successfully!");
      const timer = setTimeout(() => {
        navigate("/my-profile");
      }, 1500);
      return () => clearTimeout(timer);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const urlHasToken = 
        window.location.hash.includes("access_token") || 
        window.location.hash.includes("type=") || 
        window.location.search.includes("code=");

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && urlHasToken && session?.user) {
        setIsVerified(true);
        toast.success("Email authenticated successfully!");
        setTimeout(() => {
          navigate("/my-profile");
        }, 1500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 md:p-8"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="w-full max-w-6xl xl:max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* Left Side - Content */}
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

          {/* Content */}
          <div className="w-full max-w-md space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-[#0C005F] rounded-2xl flex items-center justify-center mb-2">
              {isVerified ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <Mail className="w-8 h-8 text-[#0C005F]" />}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[#333] tracking-tight">
              {isVerified ? "Email Verified!" : "Check your inbox"}
            </h1>

            <p className="text-sm text-slate-500 leading-relaxed">
              {isVerified 
                ? "Your email has been authenticated. Redirecting you to your employee profile..."
                : "We've sent an authentication link to your email address. Please open the link sent to your email to verify your account and access your employee profile."
              }
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full border-slate-200 text-[#333] hover:bg-slate-50 flex items-center justify-center gap-2 h-11 text-xs font-semibold rounded-lg"
                asChild
              >
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </Button>
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
