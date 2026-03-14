import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Navigation,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useOnlineDrivers,
  useRegisterDriver,
  useToggleOnlineStatus,
} from "../hooks/useQueries";

const sampleRideRequests = [
  {
    id: 1,
    pickup: "Connaught Place, Delhi",
    destination: "Agra, UP",
    fare: 1820,
    type: "Round Trip",
  },
  {
    id: 2,
    pickup: "Pune Station",
    destination: "Mumbai Airport",
    fare: 980,
    type: "One Way",
  },
  {
    id: 3,
    pickup: "MG Road, Bangalore",
    destination: "Mysore",
    fare: 1540,
    type: "One Way",
  },
];

interface DriverAppProps {
  onBack: () => void;
}

export default function DriverApp({ onBack }: DriverAppProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedRides, setAcceptedRides] = useState<number[]>([]);

  const registerDriver = useRegisterDriver();
  const toggleStatus = useToggleOnlineStatus();
  const { data: onlineDrivers } = useOnlineDrivers();

  async function handleRegister() {
    if (!name || !vehicle || !phone) {
      toast.error("Saari details bharo!");
      return;
    }
    try {
      await registerDriver.mutateAsync({ name, vehicle, phone });
      setIsRegistered(true);
      toast.success("Driver registration ho gayi! 🎉");
    } catch {
      toast.error("Registration fail hui. Dobara try karo.");
    }
  }

  async function handleToggleStatus() {
    try {
      await toggleStatus.mutateAsync();
      setIsOnline((prev) => !prev);
      toast.success(
        isOnline
          ? "Aap Offline ho gaye"
          : "Aap Online ho gaye! Rides aa sakti hain 🟢",
      );
    } catch {
      toast.error("Status update fail. Dobara try karo.");
    }
  }

  function handleAccept(rideId: number) {
    setAcceptedRides((prev) => [...prev, rideId]);
    toast.success("Ride accept kar li! Navigation shuru karo 🗺️");
  }

  const totalEarnings = acceptedRides.reduce((sum, id) => {
    const ride = sampleRideRequests.find((r) => r.id === id);
    return sum + (ride?.fare ?? 0);
  }, 0);

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
          <h2 className="font-display font-bold text-base">Driver App</h2>
          <p className="text-xs text-muted-foreground">BharatRoads Driver</p>
        </div>
        {isRegistered && (
          <Badge
            className={`ml-auto text-xs ${
              isOnline
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {isOnline ? "🟢 Online" : "⚫ Offline"}
          </Badge>
        )}
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        <AnimatePresence mode="wait">
          {!isRegistered ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-emerald-400">
                    Driver Registration
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Platform par join karo aur rides kamao
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Aapka Naam
                    </Label>
                    <Input
                      placeholder="Full name (e.g. Ramesh Kumar)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Gaadi Number
                    </Label>
                    <Input
                      placeholder="Vehicle No. (e.g. DL 01 AB 1234)"
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Phone Number
                    </Label>
                    <Input
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm"
                      type="tel"
                    />
                  </div>
                  <Button
                    data-ocid="driver.register_button"
                    onClick={handleRegister}
                    disabled={registerDriver.isPending}
                    className="w-full bg-emerald-500 text-white hover:bg-emerald-600 mt-2"
                  >
                    {registerDriver.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Driver Register Karo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Online Toggle */}
              <Card className="border-border/60 card-shine">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Online Status</p>
                      <p className="text-xs text-muted-foreground">
                        {isOnline
                          ? "Aap online hain — rides aa sakti hain"
                          : "Rides ke liye online ho jao"}
                      </p>
                    </div>
                    <Button
                      data-ocid="driver.toggle_button"
                      onClick={handleToggleStatus}
                      disabled={toggleStatus.isPending}
                      className={`px-5 ${
                        isOnline
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                          : "bg-emerald-500 text-white hover:bg-emerald-600"
                      }`}
                    >
                      {toggleStatus.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isOnline ? (
                        <>
                          <WifiOff size={14} className="mr-1.5" /> Offline Ho
                        </>
                      ) : (
                        <>
                          <Wifi size={14} className="mr-1.5" /> Online Ho
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings */}
              <Card className="border-saffron/30 bg-saffron/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-saffron/20">
                      <TrendingUp size={18} className="text-saffron" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Aaj ki Kamai
                      </p>
                      <p className="font-display font-bold text-xl text-saffron">
                        ₹{totalEarnings}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-muted-foreground">
                        Online Drivers
                      </p>
                      <p className="font-bold text-sm">
                        {onlineDrivers?.length ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ride Requests */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Ride Requests (
                  {
                    sampleRideRequests.filter(
                      (r) => !acceptedRides.includes(r.id),
                    ).length
                  }
                  )
                </p>
                <div className="space-y-3">
                  {sampleRideRequests.map((ride, i) => {
                    const accepted = acceptedRides.includes(ride.id);
                    return (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card
                          className={`border ${
                            accepted
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-border/60 card-shine"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {ride.pickup}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-sm bg-destructive shrink-0" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {ride.destination}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-border/60 text-muted-foreground"
                                  >
                                    {ride.type}
                                  </Badge>
                                  <span className="text-sm font-bold text-saffron">
                                    ₹{ride.fare}
                                  </span>
                                </div>
                              </div>
                              {accepted ? (
                                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold shrink-0">
                                  <CheckCircle size={14} />
                                  Accepted
                                </div>
                              ) : (
                                <Button
                                  data-ocid={`driver.accept_button.${i + 1}`}
                                  size="sm"
                                  onClick={() => handleAccept(ride.id)}
                                  className="bg-emerald-500 text-white hover:bg-emerald-600 shrink-0"
                                >
                                  Accept
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Placeholder */}
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Navigation size={16} className="text-saffron" />
                    <span className="font-semibold text-sm">Navigation</span>
                  </div>
                  <div className="h-24 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center">
                      🗺️ Google Maps yahan connect hoga
                      <br />
                      <span className="opacity-60">
                        Real-time navigation coming soon
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
