import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TripType } from "../backend.d";
import { useBookRide } from "../hooks/useQueries";

interface UserAppProps {
  onBack: () => void;
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  driverAllowance: number;

  gst: number;
  total: number;
}

interface BookedRide {
  id: bigint;
  pickup: string;
  destination: string;
  tripType: TripType;
  fare: number;
  status: string;
  shareLink: string;
}

function calculateFare(tripType: TripType, km = 10): FareBreakdown {
  const baseFare = 500;
  const perKm = 13;
  const distanceFare = perKm * km;
  const driverAllowance = tripType === TripType.round ? 300 : 0;

  const roundMultiplier = tripType === TripType.round ? 2 : 1;
  const preTax = (baseFare + distanceFare) * roundMultiplier + driverAllowance;
  const gst = Math.round(preTax * 0.05);
  const total = preTax + gst;
  return {
    baseFare: baseFare * roundMultiplier,
    distanceFare: distanceFare * roundMultiplier,
    driverAllowance,
    gst,
    total,
  };
}

export default function UserApp({ onBack }: UserAppProps) {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState<TripType>(TripType.oneway);
  const [bookedRide, setBookedRide] = useState<BookedRide | null>(null);
  const [driverLat, setDriverLat] = useState(0);
  const [driverLng, setDriverLng] = useState(0);
  const [copied, setCopied] = useState(false);

  const bookRideMutation = useBookRide();
  const fare = calculateFare(tripType);

  // Simulate driver GPS movement after booking
  useEffect(() => {
    if (!bookedRide) return;
    const interval = setInterval(() => {
      setDriverLat((prev) => prev + (Math.random() - 0.5) / 500);
      setDriverLng((prev) => prev + (Math.random() - 0.5) / 500);
    }, 2000);
    return () => clearInterval(interval);
  }, [bookedRide]);

  async function handleBookRide() {
    if (!pickup.trim() || !destination.trim()) {
      toast.error("Pickup aur destination dono bharo!");
      return;
    }
    try {
      const rideId = await bookRideMutation.mutateAsync({
        pickup,
        destination,
        tripType,
        fare: BigInt(fare.total),
      });
      const shareLink = `${window.location.origin}/track/${rideId.toString()}`;
      setBookedRide({
        id: rideId,
        pickup,
        destination,
        tripType,
        fare: fare.total,
        status: "Driver Dhundh Raha Hai...",
        shareLink,
      });
      toast.success("Ride book ho gayi! Driver dhundh rahe hain 🚖");
    } catch {
      toast.error("Ride book nahi hui. Dobara try karo.");
    }
  }

  function handleCopyLink() {
    if (!bookedRide) return;
    navigator.clipboard.writeText(bookedRide.shareLink).then(() => {
      setCopied(true);
      toast.success("Tracking link copy ho gaya!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Nav */}
      <div className="sticky top-0 z-10 nav-blur border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-base">Ride Karo</h2>
          <p className="text-xs text-muted-foreground">User App</p>
        </div>
        <a
          href="tel:112"
          data-ocid="user.sos_button"
          className="ml-auto flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"
        >
          <Phone size={12} />
          SOS 112
        </a>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {/* Trip Type Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="user.oneway_toggle"
            onClick={() => setTripType(TripType.oneway)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tripType === TripType.oneway
                ? "bg-saffron text-navy font-bold shadow-saffron"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            → One Way
          </button>
          <button
            type="button"
            data-ocid="user.round_toggle"
            onClick={() => setTripType(TripType.round)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tripType === TripType.round
                ? "bg-saffron text-navy font-bold shadow-saffron"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            ↔ Round Trip
          </button>
        </div>

        {/* Location Inputs */}
        <Card className="border-border/60 card-shine">
          <CardContent className="p-4 space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse-dot" />
                <div className="w-0.5 h-6 bg-border" />
                <div className="w-3 h-3 rounded-sm bg-destructive" />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  data-ocid="user.pickup_input"
                  placeholder="Pickup kahan se? (e.g. Connaught Place, Delhi)"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="border-0 bg-muted/50 text-sm h-10 focus-visible:ring-1 focus-visible:ring-saffron/50"
                />
                <Separator className="bg-border/40" />
                <Input
                  data-ocid="user.destination_input"
                  placeholder="Kahan jaana hai? (e.g. Agra, UP)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="border-0 bg-muted/50 text-sm h-10 focus-visible:ring-1 focus-visible:ring-saffron/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fare Breakdown */}
        <Card className="border-border/60 card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Fare Breakdown
              </span>
              <Badge
                variant="outline"
                className="text-xs border-saffron/40 text-saffron"
              >
                {tripType === TripType.round ? "Round Trip" : "One Way"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Fare</span>
                <span className="font-medium">₹{fare.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Distance (10 km × ₹13)
                </span>
                <span className="font-medium">₹{fare.distanceFare}</span>
              </div>
              {tripType === TripType.round && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Driver Night Allowance
                  </span>
                  <span className="font-medium">₹{fare.driverAllowance}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>GST (5%)</span>
                <span>₹{fare.gst}</span>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-foreground">Total</span>
                <span className="text-saffron">₹{fare.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Button */}
        {!bookedRide && (
          <Button
            data-ocid="user.book_button"
            onClick={handleBookRide}
            disabled={bookRideMutation.isPending}
            className="w-full h-14 text-base font-bold bg-saffron text-navy hover:bg-saffron-light transition-all rounded-xl saffron-glow"
          >
            {bookRideMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-5 w-5" />
                Ride Book Karo — ₹{fare.total}
              </>
            )}
          </Button>
        )}

        {/* Booked Ride Status */}
        <AnimatePresence>
          {bookedRide && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {/* Status Card */}
              <Card className="border-saffron/40 bg-saffron/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="animate-car text-2xl">🚖</div>
                    <div>
                      <p className="font-bold text-sm text-saffron">
                        Ride Confirmed!
                      </p>
                      <p className="text-xs text-muted-foreground animate-pulse">
                        {bookedRide.status}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-saffron/20 text-saffron border-saffron/30 text-xs">
                      ₹{bookedRide.fare}
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{bookedRide.pickup}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm bg-destructive" />
                      <span>{bookedRide.destination}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Simulated Map */}
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-saffron" />
                    <span className="text-xs font-semibold">
                      Live Driver Location
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">
                      {driverLat.toFixed(4)}, {driverLng.toFixed(4)}
                    </span>
                  </div>
                  <div className="h-28 rounded-lg bg-muted/50 flex items-center justify-center border border-border/40 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={String(i)}
                          className="absolute border-border/30"
                          style={{
                            top: `${i * 25}%`,
                            left: 0,
                            right: 0,
                            borderTopWidth: 1,
                          }}
                        />
                      ))}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={String(i)}
                          className="absolute border-border/30"
                          style={{
                            left: `${i * 25}%`,
                            top: 0,
                            bottom: 0,
                            borderLeftWidth: 1,
                          }}
                        />
                      ))}
                    </div>
                    <div className="relative flex flex-col items-center gap-1 animate-car">
                      <span className="text-3xl">🚖</span>
                      <span className="text-xs text-saffron font-semibold">
                        Driver aapki taraf aa raha hai
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Link */}
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Family ke saath share karo tracking link:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                      {bookedRide.shareLink}
                    </div>
                    <Button
                      data-ocid="user.share_link_button"
                      size="sm"
                      onClick={handleCopyLink}
                      className="bg-saffron text-navy hover:bg-saffron-light shrink-0"
                    >
                      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* New Booking */}
              <Button
                variant="outline"
                className="w-full border-border/60"
                onClick={() => {
                  setBookedRide(null);
                  setPickup("");
                  setDestination("");
                }}
              >
                <RotateCcw size={14} className="mr-2" />
                Naya Ride Book Karo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
