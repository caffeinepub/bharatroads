import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import {
  ArrowLeft,
  Car,
  CheckCircle,
  Copy,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { toast } from "sonner";
import { TripType } from "../backend.d";
import { useBookRide } from "../hooks/useQueries";

// Fix Leaflet default icon issue
(L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl =
  undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PICKUP_ICON = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const DEST_ICON = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:3px;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const DRIVER_ICON = L.divIcon({
  className: "",
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">🚖</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Coords {
  lat: number;
  lng: number;
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  driverAllowance: number;
  gst: number;
  total: number;
  km: number;
}

interface BookedRide {
  id: bigint;
  pickup: string;
  destination: string;
  tripType: TripType;
  fare: number;
  shareLink: string;
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function calculateFare(tripType: TripType, km = 10): FareBreakdown {
  const baseFare = 500;
  const perKm = 13;
  const distanceFare = Math.round(perKm * km);
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
    km: Math.round(km),
  };
}

// Sub-component to pan/zoom map to fit markers
function MapController({
  pickup,
  destination,
}: {
  pickup: Coords | null;
  destination: Coords | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (pickup && destination) {
      map.fitBounds(
        [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ],
        { padding: [60, 60] },
      );
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 14);
    }
  }, [map, pickup, destination]);
  return null;
}

interface UserAppProps {
  onBack: () => void;
}

const VEHICLE_TYPES = [
  { id: "sedan", label: "Sedan", icon: "🚗", extra: "" },
  { id: "suv", label: "SUV", icon: "🚙", extra: "+₹200" },
  { id: "hatchback", label: "Hatchback", icon: "🚘", extra: "-₹100" },
];

export default function UserApp({ onBack }: UserAppProps) {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [destCoords, setDestCoords] = useState<Coords | null>(null);
  const [tripType, setTripType] = useState<TripType>(TripType.oneway);
  const [vehicleType, setVehicleType] = useState("sedan");
  const [bookedRide, setBookedRide] = useState<BookedRide | null>(null);
  const [driverPos, setDriverPos] = useState<Coords | null>(null);
  const [copied, setCopied] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);
  const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bookRideMutation = useBookRide();

  const km =
    pickupCoords && destCoords ? haversineKm(pickupCoords, destCoords) : 10;
  const vehicleExtra =
    vehicleType === "suv" ? 200 : vehicleType === "hatchback" ? -100 : 0;
  const fareBase = calculateFare(tripType, km);
  const fare = { ...fareBase, total: fareBase.total + vehicleExtra };

  // Animate driver toward pickup after booking
  useEffect(() => {
    if (!bookedRide || !pickupCoords) return;
    const startLat = pickupCoords.lat + 0.03;
    const startLng = pickupCoords.lng + 0.03;
    setDriverPos({ lat: startLat, lng: startLng });
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const t = Math.min(step / 15, 1);
      setDriverPos({
        lat: startLat + (pickupCoords.lat - startLat) * t,
        lng: startLng + (pickupCoords.lng - startLng) * t,
      });
      if (t >= 1) clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [bookedRide, pickupCoords]);

  const detectGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("GPS is parachit mein support nahi hai");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPickupCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          );
          const data = await res.json();
          const address =
            data.display_name?.split(",").slice(0, 3).join(", ") ??
            `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setPickup(address);
          toast.success("📍 Location detect ho gayi!");
        } catch {
          setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          toast.error(
            "Location permission denied. Browser settings mein allow karein.",
          );
        } else {
          toast.error("GPS location nahi mili. Dobara try karo.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  const geocodeDestination = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 3) return;
    setDestLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1&countrycodes=in`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setDestCoords({
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        });
      }
    } catch {
      // silent fail
    }
    setDestLoading(false);
  }, []);

  function handleDestinationChange(val: string) {
    setDestination(val);
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    destDebounceRef.current = setTimeout(() => {
      geocodeDestination(val);
    }, 800);
  }

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

  const mapCenter: [number, number] = pickupCoords
    ? [pickupCoords.lat, pickupCoords.lng]
    : destCoords
      ? [destCoords.lat, destCoords.lng]
      : [20.5937, 78.9629]; // India center

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-navy">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0" style={{ height: "60vh" }}>
        <MapContainer
          center={mapCenter}
          zoom={pickupCoords || destCoords ? 13 : 5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB"
          />
          <MapController pickup={pickupCoords} destination={destCoords} />
          {pickupCoords && (
            <Marker
              position={[pickupCoords.lat, pickupCoords.lng]}
              icon={PICKUP_ICON}
            />
          )}
          {destCoords && (
            <Marker
              position={[destCoords.lat, destCoords.lng]}
              icon={DEST_ICON}
            />
          )}
          {pickupCoords && destCoords && (
            <Polyline
              positions={[
                [pickupCoords.lat, pickupCoords.lng],
                [destCoords.lat, destCoords.lng],
              ]}
              color="#f5a623"
              weight={3}
              dashArray="8 6"
              opacity={0.9}
            />
          )}
          {driverPos && (
            <Marker
              position={[driverPos.lat, driverPos.lng]}
              icon={DRIVER_ICON}
            />
          )}
        </MapContainer>
      </div>

      {/* Top header overlay */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={onBack}
          data-ocid="user.back_button"
          className="w-9 h-9 rounded-full bg-navy/80 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-navy transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2 bg-navy/80 backdrop-blur border border-white/10 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">BharatRoads</span>
        </div>
        <a
          href="tel:112"
          data-ocid="user.sos_button"
          className="flex items-center gap-1 bg-red-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/50"
        >
          <Phone size={11} />
          SOS 112
        </a>
      </div>

      {/* Bottom booking panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 rounded-t-3xl overflow-hidden"
        style={{
          background: "oklch(0.12 0.025 264)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          maxHeight: "68vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-4 pb-6 space-y-4">
          {/* Fare badge at top */}
          {pickupCoords && destCoords && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <span className="text-xs text-white/50 uppercase tracking-widest">
                Live Fare
              </span>
              <motion.span
                key={fare.total}
                initial={{ scale: 1.2, color: "oklch(0.85 0.17 53)" }}
                animate={{ scale: 1, color: "oklch(0.75 0.17 53)" }}
                className="text-xl font-bold text-saffron font-display"
              >
                ₹{fare.total}
              </motion.span>
            </motion.div>
          )}

          {/* Trip type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="user.oneway_toggle"
              onClick={() => setTripType(TripType.oneway)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tripType === TripType.oneway
                  ? "bg-saffron text-navy"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              → One Way
            </button>
            <button
              type="button"
              data-ocid="user.round_toggle"
              onClick={() => setTripType(TripType.round)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tripType === TripType.round
                  ? "bg-saffron text-navy"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              ↔ Round Trip
            </button>
          </div>

          {/* Location inputs */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            {/* Pickup row */}
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                <div className="w-px h-4 bg-white/20" />
              </div>
              <Input
                data-ocid="user.pickup_input"
                placeholder="Pickup kahan se?"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="flex-1 border-0 bg-transparent text-sm h-8 p-0 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:outline-none"
              />
              <button
                type="button"
                data-ocid="user.gps_button"
                onClick={detectGPS}
                disabled={gpsLoading}
                className="shrink-0 w-8 h-8 rounded-full bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron hover:bg-saffron/30 transition-colors disabled:opacity-50"
                title="Current location detect karo"
              >
                {gpsLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Navigation size={13} />
                )}
              </button>
            </div>

            <div className="h-px bg-white/10 mx-3" />

            {/* Destination row */}
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-px h-4 bg-white/20" />
                <div className="w-3 h-3 rounded-sm bg-red-500 ring-2 ring-red-500/30" />
              </div>
              <Input
                data-ocid="user.destination_input"
                placeholder="Kahan jaana hai? (e.g. Agra)"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") geocodeDestination(destination);
                }}
                className="flex-1 border-0 bg-transparent text-sm h-8 p-0 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:outline-none"
              />
              {destLoading && (
                <Loader2
                  size={13}
                  className="animate-spin text-saffron shrink-0"
                />
              )}
              {destCoords && !destLoading && (
                <div
                  className="shrink-0 w-2 h-2 rounded-full bg-emerald-400"
                  title="Geocoded"
                />
              )}
            </div>
          </div>

          {/* Vehicle type chips */}
          <div className="flex gap-2">
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v.id}
                type="button"
                data-ocid={`user.vehicle_${v.id}_toggle` as string}
                onClick={() => setVehicleType(v.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  vehicleType === v.id
                    ? "bg-saffron/15 border-saffron/60 text-saffron"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                <span className="text-lg">{v.icon}</span>
                <span>{v.label}</span>
                {v.extra && (
                  <span
                    className={`text-[10px] ${vehicleType === v.id ? "text-saffron/70" : "text-white/30"}`}
                  >
                    {v.extra}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Distance + fare summary */}
          {pickupCoords && destCoords && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between text-xs text-white/40 px-1"
            >
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {fare.km} km
              </span>
              <span>
                Base ₹{fare.baseFare} + Distance ₹{fare.distanceFare} + GST ₹
                {fare.gst}
              </span>
            </motion.div>
          )}

          {/* Book button or booked state */}
          <AnimatePresence mode="wait">
            {!bookedRide ? (
              <motion.div
                key="book"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Button
                  data-ocid="user.book_button"
                  onClick={handleBookRide}
                  disabled={bookRideMutation.isPending}
                  className="w-full h-14 text-base font-bold bg-saffron text-navy hover:bg-saffron-light transition-all rounded-2xl saffron-glow"
                >
                  {bookRideMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Car className="mr-2 h-5 w-5" />
                      Ride Book Karo — ₹{fare.total}
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="booked"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {/* Status */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-saffron/10 border border-saffron/30">
                  <span className="text-2xl animate-car">🚖</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-saffron">
                      Ride Confirmed!
                    </p>
                    <p className="text-xs text-white/50 animate-pulse">
                      Driver aapki taraf aa raha hai...
                    </p>
                  </div>
                  <Badge className="bg-saffron/20 text-saffron border-saffron/30 text-xs">
                    ₹{bookedRide.fare}
                  </Badge>
                </div>

                {/* Route */}
                <div className="space-y-1.5 px-2 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{bookedRide.pickup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm bg-red-400 shrink-0" />
                    <span className="truncate">{bookedRide.destination}</span>
                  </div>
                </div>

                {/* Share link */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white/40 truncate">
                    {bookedRide.shareLink}
                  </div>
                  <Button
                    data-ocid="user.share_link_button"
                    size="sm"
                    onClick={handleCopyLink}
                    className="bg-saffron text-navy hover:bg-saffron-light shrink-0 rounded-xl"
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </Button>
                </div>

                {/* New booking */}
                <Button
                  data-ocid="user.new_ride_button"
                  variant="outline"
                  className="w-full border-white/10 text-white/60 hover:bg-white/5 rounded-2xl"
                  onClick={() => {
                    setBookedRide(null);
                    setPickup("");
                    setDestination("");
                    setPickupCoords(null);
                    setDestCoords(null);
                    setDriverPos(null);
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
    </div>
  );
}
