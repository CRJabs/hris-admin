import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings as SettingsIcon, Bell, Shield, 
  Globe, Database, Sliders, Save, 
  Palette, User, Smartphone, Lock
} from "lucide-react";

export default function Settings() {
  return (
        <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-[1200px] mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0C005F]/5 flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-[#0C005F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-black uppercase tracking-tighter animate-pulse">Unfinished</Badge>
              </div>
              <p className="text-slate-500 font-medium">Configure global HRIS parameters and preferences.</p>
            </div>
          </div>
          <Button className="bg-[#0C005F] hover:bg-[#0C005F]/90 gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[
              { title: "General Configuration", description: "Basic system information and branding.", icon: Globe },
              { title: "Authentication & Security", description: "Manage login methods and session policies.", icon: Shield },
              { title: "Data Management", description: "Database backups and export settings.", icon: Database },
            ].map((section) => (
              <Card key={section.title} className="border-slate-200/60 shadow-sm hover:border-slate-300 transition-colors cursor-pointer group">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                    <section.icon className="w-6 h-6 text-slate-400 group-hover:text-[#0C005F]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">{section.title}</h3>
                    <p className="text-sm text-slate-500">{section.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200/60 shadow-sm bg-slate-50/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">System Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Version</span>
                  <span className="font-mono font-bold text-slate-900">v2.4.0-stable</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Environment</span>
                  <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">Production</Badge>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Last security audit was performed on May 1st, 2026. All systems are operational.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
