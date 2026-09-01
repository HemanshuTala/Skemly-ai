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
      "relative flex flex-col p-6 bg-[#0d0d10] border rounded-2xl transition-all",
      isPopular 
        ? "border-violet-500/30 hover:border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
        : "border-white/[0.06] hover:border-white/[0.12]"
    )}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
          POPULAR
        </div>
      )}

      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] mb-3">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">
            {isFree ? 'Free' : `₹${plan.price}`}
          </span>
          {!isFree && <span className="text-sm text-[#71717a]">/mo</span>}
        </div>
      </div>

      <div className="text-[#a1a1aa] text-sm leading-relaxed my-4">
        {plan.name} plan includes everything you need to get started.
      </div>

      <div className="flex-1 space-y-2 mb-6">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-[#a1a1aa] py-1">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Button
        variant={isCurrent ? 'secondary' : 'primary'}
        className={cn(
          "w-full mt-6 h-11 rounded-xl font-bold transition-all",
          isCurrent && "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]",
          isFree && !isCurrent && "bg-transparent border border-white/[0.08] text-white hover:bg-white/[0.02]",
          isPopular && !isCurrent && "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 hover:opacity-90 shadow-[0_0_20px_rgba(139,92,246,0.2)]",
          !isFree && !isPopular && !isCurrent && "bg-white text-[#18181b] hover:bg-[#e4e4e7]"
        )}
        disabled={isCurrent || isBusy}
        isLoading={isBusy}
        onClick={() => {
          if (!isCurrent && !isBusy) {
            onSubscribe(plan.id);
          }
        }}
      >
        {isCurrent ? 'Active' : isFree ? 'Start for free' : 'Subscribe'}
      </Button>
    </Card>
  );
}
