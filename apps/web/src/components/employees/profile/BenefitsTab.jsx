import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, Gift, Heart, Calendar, Star, LogOut, Shirt, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BENEFITS = [
  { id: 'rice', label: 'Rice Allowance', icon: ShoppingBag, requirement: 'At least 1 year of service and Regular status.' },
  { id: 'clothing', label: 'Clothing Allowance', icon: Shirt, requirement: 'Regular status.' },
  { id: 'laundry', label: 'Laundry Allowance', icon: Shirt, requirement: 'Applicable for specific departments (Maintenance/Health).' },
  { id: 'birthday', label: 'Birthday Bonus', icon: Gift, requirement: 'Active employment during birth month.' },
  { id: 'thirteenth_month', label: '13th Month Pay', icon: Calendar, requirement: 'Pro-rated based on months worked during the calendar year.' },
  { id: 'summer', label: 'Summer Pay', icon: Star, requirement: 'Applicable for Faculty during off-semester breaks.' },
  { id: 'service_award', label: 'Service Awardee', icon: Heart, requirement: 'Every 5 years of continuous service.' },
  { id: 'retirement', label: 'Retirement Benefit', icon: LogOut, requirement: 'Reaching 60 years old or 25 years of service.' },
];

export default function BenefitsTab({ employee }) {
  // Logic for eligibility (Placeholders for now)
  const checkEligibility = (benefitId) => {
    // This is where the complex logic would go. For now, returning mock data.
    const mockEligibility = {
      rice: employee.employment_status === 'Regular',
      clothing: employee.employment_status === 'Regular',
      laundry: ['Human Resources', 'Maintenance'].includes(employee.department),
      birthday: true,
      thirteenth_month: true,
      summer: employee.employment_classification === 'Faculty',
      service_award: false, // Would check length of service
      retirement: false, // Would check age
    };
    return mockEligibility[benefitId] || false;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-300">
        <CardHeader className="bg-[#0C005F]/5 p-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Employee Benefits Eligibility Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TooltipProvider>
              {BENEFITS.map((benefit) => {
                const isEligible = checkEligibility(benefit.id);
                const Icon = benefit.icon;
                
                return (
                  <div 
                    key={benefit.id} 
                    className={`flex flex-col p-4 rounded-xl border transition-all ${
                      isEligible 
                        ? 'bg-green-50/30 border-green-100 hover:border-green-200' 
                        : 'bg-muted/30 border-muted-foreground/10 hover:border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${isEligible ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isEligible ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="cursor-help">
                              <XCircle className="w-5 h-5 text-muted-foreground/40" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-xs">
                            <p className="font-bold mb-1">Ineligible</p>
                            <p>{benefit.requirement}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-sm mb-1">{benefit.label}</h4>
                    <Badge variant={isEligible ? "success" : "secondary"} className="w-fit text-[10px] uppercase">
                      {isEligible ? "Eligible" : "Not Eligible"}
                    </Badge>
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-blue-900">Note for HR Administrator</p>
          <p className="text-blue-800 opacity-80 leading-relaxed mt-1">
            Eligibility is automatically calculated based on the employee's current employment status, classification, and service records. 
            Tooltip indicators provide requirements for currently ineligible benefits.
          </p>
        </div>
      </div>
    </div>
  );
}
