import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // User Types
  type UserProfile = {
    name : Text;
    phone : Text;
    city : Text;
  };

  // Ride Types
  type RideStatus = { #requested; #confirmed; #in_progress; #completed; #cancelled };
  type TripType = { #oneway; #round };

  type Ride = {
    id : Nat;
    user : Principal;
    driver : ?Principal;
    pickup : Text;
    destination : Text;
    tripType : TripType;
    fare : Nat;
    status : RideStatus;
  };

  // Driver Types
  type DriverProfile = {
    name : Text;
    vehicle : Text;
    phone : Text;
    earnings : Nat;
    online : Bool;
  };

  // Fleet Types
  type Vehicle = {
    make : Text;
    model : Text;
    number : Text;
    ownerName : Text;
    owner : Principal;
    driver : ?Principal;
  };

  type MaintenanceAlert = {
    vehicleNumber : Text;
    issue : Text;
    owner : Principal;
  };

  // Admin Types
  type PlatformStats = {
    totalTrips : Nat;
    activeDrivers : Nat;
    totalRevenue : Nat;
    fraudAlerts : Nat;
  };

  type FraudAlert = {
    rideId : Nat;
    details : Text;
  };

  module RideModule {
    public func compare(ride1 : Ride, ride2 : Ride) : Order.Order {
      Nat.compare(ride1.id, ride2.id);
    };
  };

  // State
  let accessControlState = AccessControl.initState();
  var nextRideId = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();
  let rides = Map.empty<Nat, Ride>();
  let drivers = Map.empty<Principal, DriverProfile>();
  let vehicles = Map.empty<Text, Vehicle>();
  var maintenanceAlerts = List.empty<MaintenanceAlert>();
  var fraudAlerts = List.empty<FraudAlert>();

  include MixinAuthorization(accessControlState);

  // User Module
  public shared ({ caller }) func registerUser(name : Text, phone : Text, city : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };
    let profile : UserProfile = { name; phone; city };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Ride Module
  public shared ({ caller }) func bookRide(
    pickup : Text,
    destination : Text,
    tripType : TripType,
    fare : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can book rides");
    };
    let ride : Ride = {
      id = nextRideId;
      user = caller;
      driver = null;
      pickup;
      destination;
      tripType;
      fare;
      status = #requested;
    };
    rides.add(nextRideId, ride);
    nextRideId += 1;
    nextRideId - 1;
  };

  public shared ({ caller }) func updateRideStatus(rideId : Nat, status : RideStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update ride status");
    };
    let existingRide = switch (rides.get(rideId)) {
      case (null) { Runtime.trap("Ride does not exist") };
      case (?ride) { ride };
    };
    // Only the user who booked, assigned driver, or admin can update
    if (caller != existingRide.user and 
        (switch (existingRide.driver) { case (?d) { caller != d }; case null { true } }) and
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own rides");
    };
    let updatedRide : Ride = { existingRide with status };
    rides.add(rideId, updatedRide);
  };

  public query ({ caller }) func getRideById(rideId : Nat) : async ?Ride {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rides");
    };
    let ride = rides.get(rideId);
    switch (ride) {
      case (?r) {
        // Only the user, driver, or admin can view the ride
        if (caller != r.user and 
            (switch (r.driver) { case (?d) { caller != d }; case null { true } }) and
            not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own rides");
        };
        ride;
      };
      case null { null };
    };
  };

  public query ({ caller }) func getAllRides() : async [Ride] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all rides");
    };
    rides.values().toArray().sort();
  };

  public query ({ caller }) func getRidesByUser(user : Principal) : async [Ride] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rides");
    };
    // Users can only view their own rides unless admin
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own rides");
    };
    rides.values().toArray().filter(
      func(r : Ride) : Bool { r.user == user }
    );
  };

  // Driver Module
  public shared ({ caller }) func registerDriver(name : Text, vehicle : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register as drivers");
    };
    let driver : DriverProfile = { name; vehicle; phone; earnings = 0; online = false };
    drivers.add(caller, driver);
  };

  public shared ({ caller }) func toggleOnlineStatus() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle online status");
    };
    let existingDriver = switch (drivers.get(caller)) {
      case (null) { Runtime.trap("Driver does not exist") };
      case (?driver) { driver };
    };
    let updatedDriver : DriverProfile = {
      existingDriver with
      online = not existingDriver.online
    };
    drivers.add(caller, updatedDriver);
  };

  public query ({ caller }) func getOnlineDrivers() : async [DriverProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view online drivers");
    };
    drivers.values().toArray().filter(
      func(d : DriverProfile) : Bool { d.online }
    );
  };

  public query ({ caller }) func getDriverEarnings(driver : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view driver earnings");
    };
    // Drivers can only view their own earnings unless admin
    if (caller != driver and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own earnings");
    };
    let existingDriver = switch (drivers.get(driver)) {
      case (null) { Runtime.trap("Driver does not exist") };
      case (?driver) { driver };
    };
    existingDriver.earnings;
  };

  public shared ({ caller }) func acceptRide(rideId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept rides");
    };
    // Verify caller is a registered driver
    switch (drivers.get(caller)) {
      case (null) { Runtime.trap("Only registered drivers can accept rides") };
      case (?driver) {
        if (not driver.online) {
          Runtime.trap("Driver must be online to accept rides");
        };
      };
    };
    let existingRide = switch (rides.get(rideId)) {
      case (null) { Runtime.trap("Ride does not exist") };
      case (?ride) { ride };
    };
    if (existingRide.status != #requested) {
      Runtime.trap("Ride is not available for acceptance");
    };
    let updatedRide : Ride = { 
      existingRide with 
      driver = ?caller;
      status = #confirmed;
    };
    rides.add(rideId, updatedRide);
  };

  // Fleet Module
  public shared ({ caller }) func addVehicle(make : Text, model : Text, number : Text, ownerName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add vehicles");
    };
    let vehicle : Vehicle = { make; model; number; ownerName; owner = caller; driver = null };
    vehicles.add(number, vehicle);
  };

  public shared ({ caller }) func assignDriverToVehicle(vehicleNumber : Text, driver : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can assign drivers");
    };
    let existingVehicle = switch (vehicles.get(vehicleNumber)) {
      case (null) { Runtime.trap("Vehicle does not exist") };
      case (?vehicle) { vehicle };
    };
    // Only the vehicle owner or admin can assign drivers
    if (caller != existingVehicle.owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only vehicle owner can assign drivers");
    };
    let updatedVehicle : Vehicle = { existingVehicle with driver = ?driver };
    vehicles.add(vehicleNumber, updatedVehicle);
  };

  public query ({ caller }) func getAllVehicles() : async [Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vehicles");
    };
    vehicles.values().toArray();
  };

  public shared ({ caller }) func addMaintenanceAlert(vehicleNumber : Text, issue : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add maintenance alerts");
    };
    let vehicle = switch (vehicles.get(vehicleNumber)) {
      case (null) { Runtime.trap("Vehicle does not exist") };
      case (?v) { v };
    };
    // Only the vehicle owner or admin can add maintenance alerts
    if (caller != vehicle.owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only vehicle owner can add maintenance alerts");
    };
    let alert : MaintenanceAlert = { vehicleNumber; issue; owner = caller };
    maintenanceAlerts.add(alert);
  };

  public query ({ caller }) func getAllMaintenanceAlerts() : async [MaintenanceAlert] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance alerts");
    };
    // Users can only see their own alerts unless admin
    if (AccessControl.isAdmin(accessControlState, caller)) {
      maintenanceAlerts.toArray();
    } else {
      maintenanceAlerts.filter(func(a : MaintenanceAlert) : Bool { a.owner == caller }).toArray();
    };
  };

  // Admin Module
  public query ({ caller }) func getPlatformStats() : async PlatformStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view platform stats");
    };
    {
      totalTrips = rides.size();
      activeDrivers = drivers.values().toArray().filter(func(d : DriverProfile) : Bool { d.online }).size();
      fraudAlerts = fraudAlerts.size();
      totalRevenue = 0;
    };
  };

  public query ({ caller }) func getActiveTrips() : async [Ride] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view active trips");
    };
    rides.values().toArray().filter(
      func(r : Ride) : Bool { r.status == #in_progress }
    );
  };

  public query ({ caller }) func getFraudAlerts() : async [FraudAlert] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view fraud alerts");
    };
    fraudAlerts.toArray();
  };

  public shared ({ caller }) func addFraudAlert(rideId : Nat, details : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add fraud alerts");
    };
    let alert : FraudAlert = { rideId; details };
    fraudAlerts.add(alert);
  };
};
