import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertOctagon,
  ArrowLeft,
  Car,
  Loader2,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useActiveTrips,
  useAddFraudAlert,
  useFraudAlerts,
  usePlatformStats,
} from "../hooks/useQueries";

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [showAddFraud, setShowAddFraud] = useState(false);
  const [fraudRideId, setFraudRideId] = useState("");
  const [fraudDetails, setFraudDetails] = useState("");

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = usePlatformStats();
  const { data: activeTrips, isLoading: tripsLoading } = useActiveTrips();
  const { data: fraudAlerts, isLoading: fraudLoading } = useFraudAlerts();
  const addFraudAlert = useAddFraudAlert();

  async function handleAddFraud() {
    if (!fraudRideId || !fraudDetails) {
      toast.error("Ride ID aur details dono bharo!");
      return;
    }
    try {
      await addFraudAlert.mutateAsync({
        rideId: BigInt(fraudRideId),
        details: fraudDetails,
      });
      setFraudRideId("");
      setFraudDetails("");
      setShowAddFraud(false);
      toast.success("Fraud alert add ho gaya!");
    } catch {
      toast.error("Fraud alert add nahi hua.");
    }
  }

  const statCards = [
    {
      label: "Total Trips",
      value: stats ? stats.totalTrips.toString() : "—",
      icon: Car,
      color: "text-saffron",
      bg: "bg-saffron/10",
      border: "border-saffron/20",
    },
    {
      label: "Active Drivers",
      value: stats ? stats.activeDrivers.toString() : "—",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Revenue",
      value: stats ? `₹${stats.totalRevenue.toString()}` : "—",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Fraud Alerts",
      value: stats ? stats.fraudAlerts.toString() : "—",
      icon: AlertOctagon,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  ];

  const sampleTrips = [
    {
      id: "1",
      pickup: "Delhi CP",
      destination: "Agra",
      status: "in_progress",
      fare: "₹1820",
    },
    {
      id: "2",
      pickup: "Pune Station",
      destination: "Mumbai",
      status: "confirmed",
      fare: "₹980",
    },
    {
      id: "3",
      pickup: "MG Road, BLR",
      destination: "Mysore",
      status: "requested",
      fare: "₹1540",
    },
  ];

  const displayTrips = activeTrips?.length
    ? activeTrips.map((t) => ({
        id: t.id.toString(),
        pickup: t.pickup,
        destination: t.destination,
        status: t.status,
        fare: `₹${t.fare.toString()}`,
      }))
    : sampleTrips;

  function statusColor(status: string) {
    if (status === "in_progress")
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === "confirmed")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (status === "requested")
      return "bg-saffron/20 text-saffron border-saffron/30";
    if (status === "completed")
      return "bg-muted text-muted-foreground border-border";
    return "bg-destructive/20 text-destructive border-destructive/30";
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
          <h2 className="font-display font-bold text-base">Admin Control</h2>
          <p className="text-xs text-muted-foreground">Platform Analytics</p>
        </div>
        <button
          type="button"
          onClick={() => refetchStats()}
          className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Stats Grid */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Platform Stats
          </p>
          <div className="grid grid-cols-2 gap-2">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  data-ocid="admin.stats_card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className={`border ${s.border} ${s.bg}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className={s.color} />
                        <span className="text-xs text-muted-foreground">
                          {s.label}
                        </span>
                      </div>
                      {statsLoading ? (
                        <div className="h-6 w-12 rounded bg-muted/50 animate-pulse" />
                      ) : (
                        <p
                          className={`font-display font-bold text-lg ${s.color}`}
                        >
                          {s.value}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Active Trips */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Active Trips ({displayTrips.length})
          </p>
          <Card className="border-border/60">
            {tripsLoading ? (
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={String(i)}
                      className="h-8 rounded bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground">
                      Route
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Fare
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTrips.map((trip, i) => (
                    <TableRow
                      key={String(i)}
                      className="border-border/30 hover:bg-muted/30"
                    >
                      <TableCell className="py-2">
                        <p className="text-xs font-medium truncate max-w-[110px]">
                          {trip.pickup}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[110px]">
                          → {trip.destination}
                        </p>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          className={`text-[10px] px-1.5 py-0.5 ${statusColor(trip.status as string)}`}
                        >
                          {(trip.status as string).replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right text-sm font-bold text-saffron">
                        {trip.fare}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </section>

        {/* Fraud Alerts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Fraud Alerts
            </p>
            <Button
              data-ocid="admin.fraud_add_button"
              size="sm"
              onClick={() => setShowAddFraud((v) => !v)}
              className="bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30 h-7 text-xs"
            >
              <Plus size={12} className="mr-1" />
              Add Alert
            </Button>
          </div>

          {showAddFraud && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-3"
            >
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Ride ID
                    </Label>
                    <Input
                      placeholder="Enter ride ID number"
                      value={fraudRideId}
                      onChange={(e) => setFraudRideId(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm h-9"
                      type="number"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Fraud Details
                    </Label>
                    <Input
                      placeholder="Describe the fraud incident"
                      value={fraudDetails}
                      onChange={(e) => setFraudDetails(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm h-9"
                    />
                  </div>
                  <Button
                    onClick={handleAddFraud}
                    disabled={addFraudAlert.isPending}
                    className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/80 h-9"
                  >
                    {addFraudAlert.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : null}
                    Fraud Alert Add Karo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {fraudLoading ? (
            <div className="h-12 rounded-xl bg-muted/50 animate-pulse" />
          ) : fraudAlerts?.length ? (
            <div className="space-y-2">
              {fraudAlerts.map((alert, i) => (
                <Card
                  key={String(i)}
                  className="border-destructive/30 bg-destructive/5"
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <AlertOctagon
                      size={16}
                      className="text-destructive shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono">
                        Ride #{alert.rideId.toString()}
                      </p>
                      <p className="text-sm">{alert.details}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/40">
              <CardContent
                className="p-4 text-center"
                data-ocid="admin.empty_state"
              >
                <p className="text-xs text-muted-foreground">
                  Koi fraud alert nahi hai — platform safe hai ✅
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
