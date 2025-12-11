import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Apple, Loader2, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  price: string;
  onPaymentSuccess: () => void;
}

export function PaymentSheet({ open, onOpenChange, planName, price, onPaymentSuccess }: PaymentSheetProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setIsSuccess(true);

    setTimeout(() => {
      toast.success(`Successfully subscribed to ${planName}!`);
      onPaymentSuccess();
      onOpenChange(false);
      setIsSuccess(false);
      setCardNumber("");
      setExpiry("");
      setCvc("");
      setName("");
    }, 1500);
  };

  const handleApplePay = async () => {
    setIsProcessing(true);
    
    // Simulate Apple Pay processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    setIsSuccess(true);

    setTimeout(() => {
      toast.success(`Successfully subscribed to ${planName} via Apple Pay!`);
      onPaymentSuccess();
      onOpenChange(false);
      setIsSuccess(false);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Payment Successful!</h3>
            <p className="text-muted-foreground text-center">
              Your subscription to {planName} is now active.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscribe to {planName}</DialogTitle>
          <DialogDescription>
            {price}/month • Cancel anytime
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Method Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={paymentMethod === "card" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setPaymentMethod("card")}
            >
              <CreditCard className="w-4 h-4" />
              Card
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "apple" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setPaymentMethod("apple")}
            >
              <Apple className="w-4 h-4" />
              Apple Pay
            </Button>
          </div>

          {paymentMethod === "card" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name on card</Label>
                <Input
                  id="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card number</Label>
                <Input
                  id="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 gap-2" 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay {price}
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Apple className="w-12 h-12 mx-auto mb-2 text-foreground" />
                <p className="text-sm text-muted-foreground">
                  Complete your purchase with Apple Pay
                </p>
              </div>

              <Button
                onClick={handleApplePay}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Apple className="w-5 h-5" />
                    Pay with Apple Pay
                  </>
                )}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secured by Stripe. Your payment info is encrypted.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
