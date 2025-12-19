import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SliderInput } from "../SliderInput";
import { MultiSelectOption } from "../MultiSelectOption";
import { OptionCard } from "../OptionCard";
import { Users, TrendingDown } from "lucide-react";

const chemistryOptions = ["Humor", "Intelligence", "Confidence", "Kindness", "Ambition", "Creativity"];

// Height stats: ~14.5% of US men are 6ft+
const getHeightPoolImpact = () => ({ percent: 14.5, shrink: 85.5 });

// Income pool data
const getIncomePoolPercent = (incomeRange: string | undefined) => {
  switch (incomeRange) {
    case "250k_plus": return 1;
    case "150k_250k": return 6;
    case "100k_150k": return 15;
    case "75k_100k": return 30;
    default: return 100;
  }
};

// Combined probability
const getCombinedPool = (heightPercent: number, incomePercent: number) => {
  return (heightPercent / 100) * (incomePercent / 100) * 100;
};

const heightOptions = [
  { value: "no_preference", label: "No preference" },
  { value: "taller_than_me", label: "Taller than me" },
  { value: "shorter_than_me", label: "Shorter than me" },
  { value: "similar_height", label: "Similar height to me" },
];

const PhysicalPreferencesScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleChemistry = (v: string) => {
    const current = data.chemistryFactors || [];
    updateData({ chemistryFactors: current.includes(v) ? current.filter(x => x !== v) : [...current, v] });
  };

  // Only show pool impact for users looking for men (women or non-binary interested in men)
  const isLookingForMen = data.interestedIn?.includes("men") || data.interestedIn?.includes("all");
  const isMan = data.genderIdentity === "man_cis" || data.genderIdentity === "man_trans";
  const showPoolVisualizations = isLookingForMen && !isMan;

  const showHeightImpact = data.heightPreference === "taller_than_me" && showPoolVisualizations;
  const heightImpact = getHeightPoolImpact();
  const incomePercent = getIncomePoolPercent(data.preferredIncomeRange);
  const hasIncomePreference = incomePercent < 100;
  const combinedPool = showHeightImpact && hasIncomePreference 
    ? getCombinedPool(heightImpact.percent, incomePercent) 
    : null;

  return (
    <OnboardingLayout title="Physical & Attraction" subtitle="What creates chemistry for you?">
      <div className="space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">These are preferences to help compatibility, not strict requirements</p>
        
        <SliderInput label="How important is physical attraction?" value={data.attractionImportance || 3} onChange={(v) => updateData({ attractionImportance: v })} min={1} max={5} leftLabel="Not very" rightLabel="Very important" />
        
        {/* Height Preference */}
        <div className="space-y-3">
          <Label>Does height matter to you?</Label>
          <div className="space-y-2">
            {heightOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.heightPreference === option.value}
                onClick={() => updateData({ heightPreference: option.value })}
                title={option.label}
              />
            ))}
          </div>
          
          {/* Height Pool Impact Visual */}
          {showHeightImpact && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-fade-in space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Dating Pool Impact</span>
              </div>
              
              {/* Visual pool representation */}
              <div className="relative h-8 bg-muted/50 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-4 rounded-full transition-all duration-500 ${
                          i < Math.ceil(20 * (heightImpact.percent / 100)) 
                            ? 'bg-primary' 
                            : 'bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{heightImpact.percent}%</span> of men are 6ft+
                </span>
                <span className="text-amber-600 font-medium">Top {Math.round(heightImpact.percent)}%</span>
              </div>
              
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This filters out {Math.round(heightImpact.shrink)}% of potential matches.
              </p>
              
              {/* Combined impact with income */}
              {combinedPool !== null && (
                <div className="mt-2 pt-2 border-t border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">Combined with Income Preference</span>
                  </div>
                  
                  {/* Combined visual */}
                  <div className="relative h-6 bg-muted/50 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1 h-3 rounded-full transition-all duration-500 ${
                              i < Math.max(1, Math.ceil(20 * (combinedPool / 100))) 
                                ? 'bg-red-500' 
                                : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-red-600 font-medium">
                    Only {combinedPool.toFixed(1)}% of men are both 6ft+ AND earn {data.preferredIncomeRange?.replace(/_/g, "-").replace("plus", "+")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>What creates chemistry for you?</Label>
          <div className="grid grid-cols-2 gap-2">
            {chemistryOptions.map((o) => (
              <MultiSelectOption key={o} selected={data.chemistryFactors?.includes(o) || false} onClick={() => toggleChemistry(o)} label={o} />
            ))}
          </div>
        </div>
        <Button onClick={nextStep} disabled={!data.heightPreference || (data.chemistryFactors?.length || 0) === 0} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default PhysicalPreferencesScreen;
