import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MaintenanceAlert {
    owner: Principal;
    vehicleNumber: string;
    issue: string;
}
export interface DriverProfile {
    name: string;
    earnings: bigint;
    vehicle: string;
    phone: string;
    online: boolean;
}
export interface Ride {
    id: bigint;
    status: RideStatus;
    destination: string;
    tripType: TripType;
    fare: bigint;
    user: Principal;
    pickup: string;
    driver?: Principal;
}
export interface FraudAlert {
    rideId: bigint;
    details: string;
}
export interface PlatformStats {
    totalTrips: bigint;
    activeDrivers: bigint;
    fraudAlerts: bigint;
    totalRevenue: bigint;
}
export interface Vehicle {
    model: string;
    ownerName: string;
    owner: Principal;
    make: string;
    number: string;
    driver?: Principal;
}
export interface UserProfile {
    city: string;
    name: string;
    phone: string;
}
export enum RideStatus {
    requested = "requested",
    cancelled = "cancelled",
    in_progress = "in_progress",
    completed = "completed",
    confirmed = "confirmed"
}
export enum TripType {
    round = "round",
    oneway = "oneway"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptRide(rideId: bigint): Promise<void>;
    addFraudAlert(rideId: bigint, details: string): Promise<void>;
    addMaintenanceAlert(vehicleNumber: string, issue: string): Promise<void>;
    addVehicle(make: string, model: string, number: string, ownerName: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignDriverToVehicle(vehicleNumber: string, driver: Principal): Promise<void>;
    bookRide(pickup: string, destination: string, tripType: TripType, fare: bigint): Promise<bigint>;
    getActiveTrips(): Promise<Array<Ride>>;
    getAllMaintenanceAlerts(): Promise<Array<MaintenanceAlert>>;
    getAllRides(): Promise<Array<Ride>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDriverEarnings(driver: Principal): Promise<bigint>;
    getFraudAlerts(): Promise<Array<FraudAlert>>;
    getOnlineDrivers(): Promise<Array<DriverProfile>>;
    getPlatformStats(): Promise<PlatformStats>;
    getRideById(rideId: bigint): Promise<Ride | null>;
    getRidesByUser(user: Principal): Promise<Array<Ride>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerDriver(name: string, vehicle: string, phone: string): Promise<void>;
    registerUser(name: string, phone: string, city: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleOnlineStatus(): Promise<void>;
    updateRideStatus(rideId: bigint, status: RideStatus): Promise<void>;
}
