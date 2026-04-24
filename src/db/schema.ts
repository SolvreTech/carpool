import { pgTable, uuid, varchar, date, time, integer, timestamp, uniqueIndex, boolean, doublePrecision, text, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  nickname: varchar("nickname", { length: 100 }),
  carModel: varchar("car_model", { length: 100 }),
  carColor: varchar("car_color", { length: 50 }),
  licensePlate: varchar("license_plate", { length: 20 }),
  venmoUsername: varchar("venmo_username", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const carpools = pgTable("carpools", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => users.id),
  route: varchar("route", { length: 100 }).notNull(),
  customRoute: varchar("custom_route", { length: 255 }),
  daysOfWeek: integer("days_of_week").array().notNull(), // 0=Sun, 1=Mon, ..., 6=Sat
  time: time("time").notNull(),
  totalSeats: integer("total_seats").notNull(),
  originLat: doublePrecision("origin_lat"),
  originLng: doublePrecision("origin_lng"),
  originName: varchar("origin_name", { length: 255 }),
  destinationLat: doublePrecision("destination_lat"),
  destinationLng: doublePrecision("destination_lng"),
  destinationName: varchar("destination_name", { length: 255 }),
  routeGeometry: text("route_geometry"),
  routeDistance: integer("route_distance"),
  routeDuration: integer("route_duration"),
  gasMoneyRequested: boolean("gas_money_requested").default(false).notNull(),
  gasMoneyAmount: integer("gas_money_amount"), // cents; present when gasMoneyRequested=true
  stops: jsonb("stops").$type<{ lat: number; lng: number; name: string }[]>(),
  startDate: date("start_date"), // null = starts today / no lower bound
  endDate: date("end_date"),     // null = open-ended
  returnCarpoolId: uuid("return_carpool_id"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driverLocations = pgTable(
  "driver_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => users.id),
    carpoolId: uuid("carpool_id")
      .notNull()
      .references(() => carpools.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    heading: doublePrecision("heading"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("driver_location_carpool_idx").on(table.carpoolId),
  ]
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    carpoolId: uuid("carpool_id")
      .notNull()
      .references(() => carpools.id, { onDelete: "cascade" }),
    riderUserId: uuid("rider_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("booking_unique_idx").on(table.carpoolId, table.riderUserId, table.date),
  ]
);

export const savedRoutes = pgTable("saved_routes", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  originLat: doublePrecision("origin_lat").notNull(),
  originLng: doublePrecision("origin_lng").notNull(),
  originName: varchar("origin_name", { length: 255 }).notNull(),
  destinationLat: doublePrecision("destination_lat").notNull(),
  destinationLng: doublePrecision("destination_lng").notNull(),
  destinationName: varchar("destination_name", { length: 255 }).notNull(),
  routeGeometry: text("route_geometry"),
  routeDistance: integer("route_distance"),
  routeDuration: integer("route_duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rideInstances = pgTable(
  "ride_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    carpoolId: uuid("carpool_id")
      .notNull()
      .references(() => carpools.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress | completed
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    uniqueIndex("ride_instance_carpool_date_idx").on(table.carpoolId, table.date),
  ]
);

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expoPushToken: varchar("expo_push_token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 16 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("device_token_unique_idx").on(table.expoPushToken),
  ]
);

export const driverBlocks = pgTable(
  "driver_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => users.id),
    blockedUserId: uuid("blocked_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("driver_blocked_user_idx").on(table.driverId, table.blockedUserId),
  ]
);

// Relations
export const savedRoutesRelations = relations(savedRoutes, ({ one }) => ({
  driver: one(users, {
    fields: [savedRoutes.driverId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  carpools: many(carpools),
  bookings: many(bookings),
  savedRoutes: many(savedRoutes),
  blocksAsDriver: many(driverBlocks, { relationName: "driverBlocks" }),
  blocksAsBlocked: many(driverBlocks, { relationName: "blockedByDrivers" }),
}));

export const carpoolsRelations = relations(carpools, ({ one, many }) => ({
  driver: one(users, {
    fields: [carpools.driverId],
    references: [users.id],
  }),
  bookings: many(bookings),
  rideInstances: many(rideInstances),
}));

export const rideInstancesRelations = relations(rideInstances, ({ one }) => ({
  carpool: one(carpools, {
    fields: [rideInstances.carpoolId],
    references: [carpools.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  carpool: one(carpools, {
    fields: [bookings.carpoolId],
    references: [carpools.id],
  }),
  rider: one(users, {
    fields: [bookings.riderUserId],
    references: [users.id],
  }),
}));

export const driverLocationsRelations = relations(driverLocations, ({ one }) => ({
  driver: one(users, {
    fields: [driverLocations.driverId],
    references: [users.id],
  }),
  carpool: one(carpools, {
    fields: [driverLocations.carpoolId],
    references: [carpools.id],
  }),
}));

export const driverBlocksRelations = relations(driverBlocks, ({ one }) => ({
  driver: one(users, {
    fields: [driverBlocks.driverId],
    references: [users.id],
    relationName: "driverBlocks",
  }),
  blockedUser: one(users, {
    fields: [driverBlocks.blockedUserId],
    references: [users.id],
    relationName: "blockedByDrivers",
  }),
}));
