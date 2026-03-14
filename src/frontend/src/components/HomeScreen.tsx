import { Car, LayoutDashboard, MapPin, Shield, Truck } from "lucide-react";
import { motion } from "motion/react";
import type { Screen } from "../App";

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

const roles = [
  {
    id: "user" as Screen,
    title: "Ride Karo",
    subtitle: "User Ride App",
    desc: "Book intercity rides, track driver live, share trip link with family",
    icon: Car,
    gradient: "from-saffron/20 to-saffron/5",
    iconColor: "text-saffron",
    border: "border-saffron/30",
    ocid: "home.user_button",
  },
  {
    id: "driver" as Screen,
    title: "Driver Bano",
    subtitle: "Driver App",
    desc: "Accept rides, go online/offline, track daily earnings dashboard",
    icon: MapPin,
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/30",
    ocid: "home.driver_button",
  },
  {
    id: "fleet" as Screen,
    title: "Fleet Chalao",
    subtitle: "Fleet Owner Portal",
    desc: "Manage vehicles, assign drivers, track maintenance alerts",
    icon: Truck,
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    border: "border-blue-500/30",
    ocid: "home.fleet_button",
  },
  {
    id: "admin" as Screen,
    title: "Admin Control",
    subtitle: "Admin Panel",
    desc: "Platform stats, live trips, revenue tracking, fraud detection",
    icon: Shield,
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    border: "border-purple-500/30",
    ocid: "home.admin_button",
  },
];

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-6 pt-12 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron/10 via-transparent to-transparent" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-saffron/5 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/assets/generated/bharatroads-logo-transparent.dim_120x120.png"
              alt="BharatRoads"
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
                Bharat<span className="text-saffron">Roads</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                India&apos;s Premium Ride Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block w-6 h-1 rounded-full bg-saffron" />
            <span className="inline-block w-3 h-1 rounded-full bg-white/60" />
            <span className="inline-block w-6 h-1 rounded-full bg-emerald-500" />
          </div>
        </motion.div>
      </div>

      {/* Role Cards */}
      <div className="flex-1 px-4 pb-8 space-y-3">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs uppercase tracking-widest text-muted-foreground px-2 mb-4"
        >
          Apna Role Chuniye
        </motion.p>

        {roles.map((role, i) => {
          const Icon = role.icon;
          return (
            <motion.button
              key={role.id}
              data-ocid={role.ocid}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.1 + i * 0.1,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(role.id)}
              className={`w-full text-left rounded-2xl border ${role.border} bg-gradient-to-r ${role.gradient} p-5 group transition-all duration-200 hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 p-2.5 rounded-xl bg-card/80 ${role.iconColor}`}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-display font-bold text-lg ${role.iconColor}`}
                    >
                      {role.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {role.subtitle}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-saffron hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
