import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Loader2, Plus, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddMaintenanceAlert,
  useAddVehicle,
  useAllVehicles,
  useMaintenanceAlerts,
} from "../hooks/useQueries";

interface FleetPortalProps {
  onBack: () => void;
}

export default function FleetPortal({ onBack }: FleetPortalProps) {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [number, setNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [alertVehicle, setAlertVehicle] = useState("");
  const [alertIssue, setAlertIssue] = useState("");

  const { data: vehicles, isLoading: vehiclesLoading } = useAllVehicles();
  const { data: alerts, isLoading: alertsLoading } = useMaintenanceAlerts();
  const addVehicle = useAddVehicle();
  const addAlert = useAddMaintenanceAlert();

  async function handleAddVehicle() {
    if (!make || !model || !number || !ownerName) {
      toast.error("Saari vehicle details bharo!");
      return;
    }
    try {
      await addVehicle.mutateAsync({ make, model, number, ownerName });
      setMake("");
      setModel("");
      setNumber("");
      setOwnerName("");
      setShowAddVehicle(false);
      toast.success("Vehicle add ho gayi! 🚗");
    } catch {
      toast.error("Vehicle add nahi hua. Dobara try karo.");
    }
  }

  async function handleAddAlert() {
    if (!alertVehicle || !alertIssue) {
      toast.error("Vehicle number aur issue dono bharo!");
      return;
    }
    try {
      await addAlert.mutateAsync({
        vehicleNumber: alertVehicle,
        issue: alertIssue,
      });
      setAlertVehicle("");
      setAlertIssue("");
      setShowAddAlert(false);
      toast.success("Maintenance alert add ho gaya!");
    } catch {
      toast.error("Alert add nahi hua.");
    }
  }

  const sampleVehicles = [
    {
      make: "Maruti",
      model: "Dzire",
      number: "DL 01 AB 1234",
      ownerName: "Suresh Gupta",
    },
    {
      make: "Tata",
      model: "Indica",
      number: "MH 12 CD 5678",
      ownerName: "Priya Sharma",
    },
    {
      make: "Honda",
      model: "Amaze",
      number: "KA 05 EF 9012",
      ownerName: "Ravi Verma",
    },
  ];

  const displayVehicles = vehicles?.length ? vehicles : sampleVehicles;

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
          <h2 className="font-display font-bold text-base">Fleet Chalao</h2>
          <p className="text-xs text-muted-foreground">Fleet Owner Portal</p>
        </div>
        <Badge className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
          {displayVehicles.length} Vehicles
        </Badge>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Vehicle List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Aapki Gaadiyaan
            </p>
            <Button
              data-ocid="fleet.add_vehicle_button"
              size="sm"
              onClick={() => setShowAddVehicle((v) => !v)}
              className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 h-7 text-xs"
            >
              <Plus size={12} className="mr-1" />
              Add Vehicle
            </Button>
          </div>

          {/* Add Vehicle Form */}
          {showAddVehicle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Make
                      </Label>
                      <Input
                        placeholder="e.g. Maruti"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        className="bg-muted/50 border-border/60 text-sm h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Model
                      </Label>
                      <Input
                        placeholder="e.g. Dzire"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="bg-muted/50 border-border/60 text-sm h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Vehicle Number
                    </Label>
                    <Input
                      placeholder="e.g. DL 01 AB 1234"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Owner Name
                    </Label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm h-9"
                    />
                  </div>
                  <Button
                    onClick={handleAddVehicle}
                    disabled={addVehicle.isPending}
                    className="w-full bg-blue-500 text-white hover:bg-blue-600 h-9"
                  >
                    {addVehicle.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : null}
                    Vehicle Add Karo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {vehiclesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={String(i)}
                  className="h-16 rounded-xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayVehicles.map((v, i) => (
                <motion.div
                  key={String(i)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border-border/60 card-shine">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Truck size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {(v as (typeof sampleVehicles)[0]).make}{" "}
                          {(v as (typeof sampleVehicles)[0]).model}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {(v as (typeof sampleVehicles)[0]).number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {(v as (typeof sampleVehicles)[0]).ownerName}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-500/30 text-emerald-400 mt-0.5"
                        >
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Maintenance Alerts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Maintenance Alerts
            </p>
            <Button
              data-ocid="fleet.add_alert_button"
              size="sm"
              onClick={() => setShowAddAlert((v) => !v)}
              className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 h-7 text-xs"
            >
              <Plus size={12} className="mr-1" />
              Add Alert
            </Button>
          </div>

          {showAddAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-3"
            >
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Vehicle Number
                    </Label>
                    <Input
                      placeholder="e.g. DL 01 AB 1234"
                      value={alertVehicle}
                      onChange={(e) => setAlertVehicle(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Issue Description
                    </Label>
                    <Input
                      placeholder="e.g. Tyre puncture, Oil change needed"
                      value={alertIssue}
                      onChange={(e) => setAlertIssue(e.target.value)}
                      className="bg-muted/50 border-border/60 text-sm h-9"
                    />
                  </div>
                  <Button
                    onClick={handleAddAlert}
                    disabled={addAlert.isPending}
                    className="w-full bg-orange-500 text-white hover:bg-orange-600 h-9"
                  >
                    {addAlert.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : null}
                    Alert Add Karo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {alertsLoading ? (
            <div className="h-12 rounded-xl bg-muted/50 animate-pulse" />
          ) : alerts?.length ? (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <Card
                  key={String(i)}
                  className="border-orange-500/30 bg-orange-500/5"
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <AlertTriangle
                      size={16}
                      className="text-orange-400 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">
                        {alert.vehicleNumber}
                      </p>
                      <p className="text-sm">{alert.issue}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/40">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Koi maintenance alert nahi hai abhi 👍
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
