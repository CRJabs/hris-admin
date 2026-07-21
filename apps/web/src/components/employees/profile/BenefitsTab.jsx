import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, Gift, Heart, Calendar, Star, LogOut, ShoppingBag, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const BENEFITS = [
  { id: 'rice_clothing_laundry', label: 'Rice, Clothing & Laundry', icon: ShoppingBag, requirement: 'Requires Regular, Probationary, or Part-Time employment tenure.' },
  { id: 'birthday_bonus', label: 'Birthday Bonus', icon: Gift, requirement: 'Requires at least 1 year of continuous service.' },
  { id: 'summer_pay', label: 'Summer Pay', icon: Star, requirement: 'Requires at least 3 years of service as Regular, Probationary, or Part-Time before May 31.' },
  { id: 'thirteenth_month', label: '13th Month Pay', icon: Calendar, requirement: 'Requires at least 1 month of rendered service.' },
  { id: 'midyear_bonus', label: 'Midyear Bonus', icon: Star, requirement: 'Requires Regular employment tenure and at least 1 month of service.' },
  { id: 'service_award', label: 'Service Awardee', icon: Heart, requirement: 'Reaches a 10, 15, or 25-year service milestone before July 31.' },
  { id: 'retirement', label: 'Retirement Benefit', icon: LogOut, requirement: 'Requires age 57 or above AND 25 years of service before May 31.' },
];

export default function BenefitsTab({ employee }) {
  const [eligibilityData, setEligibilityData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBenefits() {
      if (!employee?.id) return;
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('employee_benefits')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('eligibility_year', currentYear);

        if (error) throw error;

        const dataMap = (data || []).reduce((acc, row) => {
          acc[row.benefit_key] = row;
          return acc;
        }, {});
        
        setEligibilityData(dataMap);
      } catch (err) {
        console.error("Error fetching benefits data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBenefits();

    if (!employee?.id) return;

    const channel = supabase
      .channel(`benefits_realtime_${employee.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_benefits',
          filter: `employee_id=eq.${employee.id}`,
        },
        () => {
          fetchBenefits();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [employee?.id]);

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center text-slate-400 text-xs font-medium flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#0C005F] border-t-transparent rounded-full animate-spin"></div>
        Loading eligibility records...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((benefit) => {
            const record = eligibilityData[benefit.id];
            const isEligible = record?.is_eligible || false;
            const Icon = benefit.icon;
            
            return (
              <div 
                key={benefit.id} 
                className={`flex flex-col p-4 rounded-[8px] border transition-all ${
                  isEligible 
                    ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' 
                    : (!record ? 'bg-amber-50/30 border-amber-200' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300')
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${isEligible ? 'bg-emerald-100 text-emerald-700' : (!record ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isEligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : !record ? (
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-slate-900 mb-1">{benefit.label}</h4>
                  {((benefit.id === 'retirement' && (!employee?.is_active || (record?.award_level?.toLowerCase() === 'retired' && !employee?.is_active)))
                    || (benefit.id !== 'retirement' && record?.award_level && record?.award_level?.toLowerCase() !== 'retired')) && (
                    <p className="text-2xs text-[#0C005F] font-black uppercase tracking-wider mb-2">
                      {benefit.id === 'retirement' ? 'RETIRED' : record.award_level}
                    </p>
                  )}
                  <Badge variant="outline" className={`w-fit text-2xs font-bold uppercase tracking-wider ${
                    isEligible 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : (!record ? 'text-amber-700 border-amber-200 bg-amber-50' : 'bg-slate-100 text-slate-600 border-slate-200')
                  }`}>
                    {isEligible ? "Eligible" : (!record ? "Pending Eval" : "Not Eligible")}
                  </Badge>
                </div>

                {record?.computed_at && (
                  <p className="text-2xs text-slate-400 font-medium mt-2">
                    Computed: {format(new Date(record.computed_at), "MMM d, yyyy")}
                  </p>
                )}

                {/* Requirements Button on lower left with Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="inline-flex items-center gap-1.5 text-2xs font-bold text-slate-600 hover:text-[#0C005F] transition-colors mt-3 pt-2.5 border-t border-slate-200/60 w-full justify-start text-left cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Requirements
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px] text-xs p-3 bg-[#0C005F] text-white font-medium shadow-xl rounded-xl border border-[#0a0050]">
                    <p className="font-bold mb-1 text-amber-400">Eligibility Requirement</p>
                    <p className="text-slate-100 leading-normal">{benefit.requirement}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}

