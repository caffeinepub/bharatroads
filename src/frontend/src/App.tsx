import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import DriverApp from "./components/DriverApp";
import FleetPortal from "./components/FleetPortal";
import HomeScreen from "./components/HomeScreen";
import UserApp from "./components/UserApp";

export type Screen = "home" | "user" | "driver" | "fleet" | "admin";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen relative overflow-hidden">
        {screen === "home" && <HomeScreen onNavigate={setScreen} />}
        {screen === "user" && <UserApp onBack={() => setScreen("home")} />}
        {screen === "driver" && <DriverApp onBack={() => setScreen("home")} />}
        {screen === "fleet" && <FleetPortal onBack={() => setScreen("home")} />}
        {screen === "admin" && <AdminPanel onBack={() => setScreen("home")} />}
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
