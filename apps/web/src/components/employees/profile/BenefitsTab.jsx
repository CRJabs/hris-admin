import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, Gift, Heart, Calendar, Star, LogOut, Shirt, ShoppingBag, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const BENEFITS = [
  { id: 'rice_clothing_laundry', label: 'Rice, Clothing & Laundry', icon: ShoppingBag, requirement: 'Requires Regular, Probationary, or Part-Time employment tenure.' },
  { id: 'birthday_bonus', label: 'Birthday Bonus', icon: Gift, requirement: 'Requires at least 1 year of continuous service.' },
  { id: 'summer_pay', label: 'Summer Pay', icon: Star, requirement: 'Requires at least 3 years of service as Regular, Probationary, or Part-Time before May 31.' },
  { id: 'thirteenth_month', label: '13th Month Pay', icon: Calendar, requirement: 'Requires at least 1 month of service rendered before December 31.' },
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

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-300">
        <CardHeader className="bg-[#0C005F]/5 p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Employee Benefits Eligibility Checklist
          </CardTitle>
          {Object.keys(eligibilityData).length > 0 && (
             <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border shadow-sm">
                <Clock className="w-3 h-3" />
                Updated for {new Date().getFullYear()}
             </span>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 flex justify-center text-muted-foreground text-sm flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading eligibility records...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <TooltipProvider>
                {BENEFITS.map((benefit) => {
                  const record = eligibilityData[benefit.id];
                  const isEligible = record?.is_eligible || false;
                  const Icon = benefit.icon;
                  
                  return (
                    <div 
                      key={benefit.id} 
                      className={`flex flex-col p-4 rounded-xl border transition-all ${
                        isEligible 
                          ? 'bg-green-50/30 border-green-100 hover:border-green-200' 
                          : (!record ? 'bg-amber-50/30 border-amber-100' : 'bg-muted/30 border-muted-foreground/10 hover:border-muted-foreground/20')
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isEligible ? 'bg-green-100 text-green-700' : (!record ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground')}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {isEligible ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : !record ? (
                          <Clock className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="cursor-help">
                                <XCircle className="w-5 h-5 text-muted-foreground/40" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p className="font-bold mb-1">Ineligible / Pending</p>
                              <p>{benefit.requirement}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">{benefit.label}</h4>
                        {record?.award_level && benefit.id !== 'retirement' && record.award_level.toLowerCase() !== 'retired' && (
                          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">
                            {record.award_level}
                          </p>
                        )}
                        <Badge variant={isEligible ? "success" : (!record ? "outline" : "secondary")} className={`w-fit text-[10px] uppercase ${!record && 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                          {isEligible ? "Eligible" : (!record ? "Pending Eval" : "Not Eligible")}
                        </Badge>
                      </div>

                      {record?.computed_at && (
                        <p className="text-[9px] text-muted-foreground mt-3 pt-2 border-t">
                          Computed: {format(new Date(record.computed_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
