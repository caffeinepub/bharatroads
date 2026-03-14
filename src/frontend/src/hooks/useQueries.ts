import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RideStatus, TripType, type UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function usePlatformStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["platformStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlatformStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useActiveTrips() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activeTrips"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveTrips();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useOnlineDrivers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["onlineDrivers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOnlineDrivers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useFraudAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["fraudAlerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFraudAlerts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllVehicles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allVehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVehicles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMaintenanceAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["maintenanceAlerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMaintenanceAlerts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserRides(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRides", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getRidesByUser(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useBookRide() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      pickup: string;
      destination: string;
      tripType: TripType;
      fare: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.bookRide(
        args.pickup,
        args.destination,
        args.tripType,
        args.fare,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRides"] });
      queryClient.invalidateQueries({ queryKey: ["activeTrips"] });
    },
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { name: string; phone: string; city: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerUser(args.name, args.phone, args.city);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useRegisterDriver() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      vehicle: string;
      phone: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerDriver(args.name, args.vehicle, args.phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onlineDrivers"] });
    },
  });
}

export function useToggleOnlineStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.toggleOnlineStatus();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onlineDrivers"] });
    },
  });
}

export function useAddVehicle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      make: string;
      model: string;
      number: string;
      ownerName: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addVehicle(
        args.make,
        args.model,
        args.number,
        args.ownerName,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVehicles"] });
    },
  });
}

export function useAddMaintenanceAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { vehicleNumber: string; issue: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addMaintenanceAlert(args.vehicleNumber, args.issue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceAlerts"] });
    },
  });
}

export function useAddFraudAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { rideId: bigint; details: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addFraudAlert(args.rideId, args.details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraudAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["platformStats"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useUpdateRideStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { rideId: bigint; status: RideStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateRideStatus(args.rideId, args.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTrips"] });
    },
  });
}

export { TripType, RideStatus };
