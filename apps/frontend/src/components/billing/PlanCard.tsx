import { Check, Zap, Star, Rocket } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  isBusy: boolean;
  onSubscribe: (planId: string) => void;
}

const planIcons = {
  free: Star,
  starter: Star,
  basic: Zap,
  pro: Zap,
  enterprise: Rocket,
} as const;

export function PlanCard({
  plan,
  isCurrent,
  isBusy,
  onSubscribe,
}: PlanCardProps) {
  const Icon = planIcons[plan.id as keyof typeof planIcons] || Zap;
  const isFree = plan.price === 0;

  const isPopular = plan.popular && !isCurrent;

  return (
    <Card className={cn(
      "relative flex flex-col p-4 border transition-all bg-[#18181b]",
      isCurrent
        ? "border-[#52525b]"
        : isPopular
          ? "border-[#3f3f46] hover:border-[#52525b]"
          : "border-[#27272a] hover:border-[#3f3f46]"
    )}>
      {isCurrent && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#27272a] text-[10px] font-medium text-white border border-[#3f3f46]">
          Current
        </div>
      )}
      {isPopular && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#27272a] text-[10px] font-medium text-white border border-[#52525b]">
          Popular
        </div>
      )}

      <div className="mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-2 bg-[#27272a] text-[#a1a1aa]",
          isCurrent && "bg-[#3f3f46] text-white"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-base font-medium text-white">{plan.name}</h3>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-xl font-semibold">
            {isFree ? 'Free' : `₹${plan.price}`}
          </span>
          {!isFree && <span className="text-xs text-[#71717a]">/mo</span>}
        </div>
      </div>

      <div className="flex-1 space-y-1.5 mb-4">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-[#a1a1aa]">
            <Check className={cn(
              "w-3.5 h-3.5 mt-0.5 shrink-0",
              isCurrent ? "text-white" : "text-[#52525b]"
            )} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Button
        variant={isCurrent ? 'secondary' : 'primary'}
        className={cn(
          "w-full h-9 text-sm",
          !isCurrent && "bg-white text-[#18181b] hover:bg-[#e4e4e7] border-0"
        )}
        disabled={isCurrent || isBusy}
        isLoading={isBusy}
        onClick={() => {
          if (!isCurrent && !isBusy) {
            onSubscribe(plan.id);
          }
        }}
      >
        {isCurrent ? 'Active' : isFree ? 'Start' : 'Subscribe'}
      </Button>
    </Card>
  );
}
