import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, CheckCircle2 } from "lucide-react";

interface BetaNdaDialogProps {
  open: boolean;
  onAccept: () => void;
  viewOnly?: boolean;
  acceptedAt?: string | null;
}

export const BetaNdaDialog: React.FC<BetaNdaDialogProps> = ({ 
  open, 
  onAccept, 
  viewOnly = false,
  acceptedAt 
}) => {
  const [hasReadNda, setHasReadNda] = useState(false);
  const [acceptsNda, setAcceptsNda] = useState(false);

  const handleAccept = () => {
    if (hasReadNda && acceptsNda) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={viewOnly ? () => onAccept() : () => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden" hideCloseButton={!viewOnly}>
        <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Beta Tester Agreement</DialogTitle>
              <DialogDescription className="text-sm">
                {viewOnly 
                  ? acceptedAt 
                    ? `Accepted on ${new Date(acceptedAt).toLocaleDateString()}`
                    : "Your accepted agreement"
                  : "Please review and accept to continue"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[40vh] px-6 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Beta Tester Non-Disclosure Agreement
            </h3>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              This Non-Disclosure Agreement ("Agreement") is entered into by and between IdeaaHaus, 
              a DBA of United Transport Consulting, Inc., located in Escondido, California ("Company"), 
              and you, the individual accessing or using the Beta Product ("Beta Tester"). 
              By accessing the Beta Product, you agree to the terms of this Agreement.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">1. Purpose</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              The purpose of this Agreement is to allow Beta Tester to evaluate and test a pre-release 
              website, application, or related services ("Beta Product") solely for feedback and evaluation purposes.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">2. Confidential Information</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              Confidential Information includes all non-public information relating to the Beta Product, 
              including but not limited to features, designs, functionality, workflows, logic, screenshots, 
              user experience, technical details, business processes, and any other information disclosed during beta testing.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">3. Beta Tester Obligations</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              By using the Beta Product, Beta Tester acknowledges and agrees that:
            </p>
            <ul className="text-muted-foreground text-sm space-y-1.5 list-disc pl-5 mb-3">
              <li>I will not disclose, share, publish, or discuss any Confidential Information with any third party.</li>
              <li>I will use the Beta Product solely for testing and evaluation purposes.</li>
              <li>I will not copy, reproduce, reverse engineer, decompile, or attempt to derive source code or logic.</li>
              <li>I will not capture or distribute screenshots, screen recordings, or demonstrations without written permission.</li>
              <li>I will promptly notify the Company of any bugs, vulnerabilities, or unauthorized access.</li>
            </ul>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">4. Ownership</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              All Confidential Information and the Beta Product are and shall remain the exclusive property of the Company. 
              No license, ownership, or other rights are granted except as expressly stated.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">5. Term</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              This Agreement remains effective for the duration of beta access and for two (2) years thereafter, 
              or until the Confidential Information becomes publicly available through no fault of the Beta Tester.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">6. Remedies</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              Beta Tester acknowledges that unauthorized disclosure or misuse may cause irreparable harm. 
              The Company may seek injunctive relief and all other remedies available under applicable law.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">7. Governing Law</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              This Agreement shall be governed by and construed in accordance with the laws of the State of California.
            </p>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">8. Acceptance</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This Agreement is accepted electronically through use of the Beta Product and does not require a physical signature.
            </p>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border/50 space-y-4 bg-muted/30">
          {viewOnly ? (
            <Button
              onClick={onAccept}
              className="w-full h-12 rounded-xl"
              variant="outline"
            >
              Close
            </Button>
          ) : (
            <>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setHasReadNda(!hasReadNda)}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left ${
                    hasReadNda 
                      ? "border-primary bg-primary/5" 
                      : "border-border/50 bg-background/50 hover:border-primary/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    hasReadNda 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted border border-border"
                  }`}>
                    {hasReadNda && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm">I have read the Beta Tester NDA in its entirety</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAcceptsNda(!acceptsNda)}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left ${
                    acceptsNda 
                      ? "border-primary bg-primary/5" 
                      : "border-border/50 bg-background/50 hover:border-primary/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    acceptsNda 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted border border-border"
                  }`}>
                    {acceptsNda && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm">I accept and agree to the terms of this Agreement</span>
                </button>
              </div>

              <Button
                onClick={handleAccept}
                disabled={!hasReadNda || !acceptsNda}
                className="w-full h-12 rounded-xl bg-[image:var(--gradient-hero)] hover:opacity-90 transition-all duration-300 shadow-[var(--shadow-soft)] text-base font-semibold"
              >
                <Shield className="w-4 h-4 mr-2" />
                Accept & Continue
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
