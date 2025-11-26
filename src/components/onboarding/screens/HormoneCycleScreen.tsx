import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { OptionCard } from "../OptionCard";
import { SliderInput } from "../SliderInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const transitionOptions = [
  { value: "pre", label: "Pre-transition" },
  { value: "early", label: "Early transition (0-2 years)" },
  { value: "established", label: "Established (2+ years)" },
  { value: "not_medical", label: "Not medically transitioning" },
];

const hormoneOptions = [
  { value: "estrogen", label: "Estrogen-dominant" },
  { value: "testosterone", label: "Testosterone-dominant" },
  { value: "mixed", label: "Mixed/changing" },
  { value: "no_hrt", label: "No HRT" },
];

const regularityOptions = [
  { value: "very_regular", label: "Very regular" },
  { value: "somewhat_regular", label: "Somewhat regular" },
  { value: "irregular", label: "Irregular" },
  { value: "pcos_endo", label: "PCOS/Endometriosis" },
  { value: "perimenopause", label: "Perimenopause" },
];

const HormoneCycleScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const showTransSection = data.genderIdentity === "woman_trans" || data.isTrans;
  const showCycleSection = !showTransSection || data.trackCycle;

  return (
    <OnboardingLayout
      title="Hormone & Cycle Profile"
      subtitle="This information helps personalize your experience"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Trans Section */}
        {(data.genderIdentity === "woman_trans" || data.genderIdentity === "non_binary") && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
            <h3 className="font-medium">Transition Journey</h3>
            
            <div className="space-y-3">
              <Label>Your transition timeline:</Label>
              <div className="space-y-2">
                {transitionOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    selected={data.transitionStage === option.value}
                    onClick={() => updateData({ transitionStage: option.value })}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Current hormone profile:</Label>
              <div className="space-y-2">
                {hormoneOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    selected={data.hormoneProfile === option.value}
                    onClick={() => updateData({ hormoneProfile: option.value })}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <SliderInput
              label="How connected are you to LGBTQ+ community?"
              value={data.lgbtqConnection || 3}
              onChange={(value) => updateData({ lgbtqConnection: value })}
              min={1}
              max={5}
              leftLabel="Not connected"
              rightLabel="Very active"
            />
          </div>
        )}

        {/* Cycle Tracking Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Track your cycle for smarter dating?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Hormone-aware dating guidance
              </p>
            </div>
            <Switch
              checked={data.trackCycle}
              onCheckedChange={(checked) => updateData({ trackCycle: checked })}
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="why" className="border-none">
              <AccordionTrigger className="text-sm text-primary hover:no-underline py-2">
                Why this helps
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Your cycle affects attraction, decision-making, and emotional bonding. 
                Tracking helps us time advice and warnings to your hormonal state, 
                giving you clearer insights during ovulation (when attraction peaks) 
                and PMS (when emotions run high).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {data.trackCycle && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
            <div className="space-y-2">
              <Label>Last period start date:</Label>
              <Input
                type="date"
                value={data.lastPeriodDate || ""}
                onChange={(e) => updateData({ lastPeriodDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Typical cycle length:</Label>
              <Select
                value={data.cycleLength?.toString()}
                onValueChange={(value) => updateData({ cycleLength: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle length" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => i + 21).map((days) => (
                    <SelectItem key={days} value={days.toString()}>
                      {days} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Regularity:</Label>
              <div className="space-y-2">
                {regularityOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    selected={data.cycleRegularity === option.value}
                    onClick={() => updateData({ cycleRegularity: option.value })}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={nextStep}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>

        <Button
          variant="ghost"
          onClick={nextStep}
          className="w-full text-muted-foreground"
        >
          Skip for now
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default HormoneCycleScreen;
