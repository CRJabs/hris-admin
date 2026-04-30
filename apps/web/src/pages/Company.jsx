import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building2, Users, UserPlus, Mail, Phone, 
  MapPin, ChevronRight, Share2, MoreVertical,
  Briefcase, GraduationCap, Award, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Company() {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Page Content (Empty/Skeleton State) */}
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 opacity-70 blur-[1px] grayscale select-none pointer-events-none">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-4 w-96 bg-slate-100 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
             <div className="h-4 w-32 bg-slate-100 rounded mb-6" />
             <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="border-slate-100 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 bg-slate-200 rounded" />
                        <div className="h-2 w-20 bg-slate-100 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </div>
          <div className="lg:col-span-8">
             <Card className="border-slate-100 shadow-none h-[600px] bg-slate-50/50" />
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center ring-1 ring-slate-100">
            <Lock className="w-10 h-10 text-slate-300" />
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">Module to be added</h2>
            <p className="text-slate-500 font-medium text-lg">This feature is currently under development.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Integration in Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
