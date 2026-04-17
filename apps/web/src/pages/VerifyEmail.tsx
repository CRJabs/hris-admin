import React from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0C005F] to-[#1900C5]"
      style={{ fontFamily: '"Figtree", sans-serif' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/assets/ub-hris-logo.png"
              alt="University of Bohol HRIS Logo"
              className="h-16 object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/300x80?text=UB+HRIS+Logo";
              }}
            />
          </div>

          {/* Icon */}
          <div className="w-20 h-20 bg-blue-50 text-[#0C005F] rounded-full flex items-center justify-center mb-6">
            <Mail className="w-10 h-10" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your inbox</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            We've sent a confirmation link to your email address. 
            Please click the link to verify your account and start your 201 Personnel Filing.
          </p>

          <div className="w-full space-y-4">
            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 py-6"
              asChild
            >
              <Link to="/login">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </Button>
          </div>

          {/* Footer Logo */}
          <div className="flex justify-center mt-12">
            <img
              src="/assets/ub-footer-logo.png"
              alt="UB Scholarship Character Service"
              className="h-8 object-contain opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
