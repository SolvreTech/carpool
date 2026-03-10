import { pgTable, uuid, varchar, date, time, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const carpools = pgTable("carpools", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => users.id),
  route: varchar("route", { length: 100 }).notNull(),
  customRoute: varchar("custom_route", { length: 255 }),
  date: date("date").notNull(),
  time: time("time").notNull(),
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  carpoolId: uuid("carpool_id")
    .notNull()
    .references(() => carpools.id, { onDelete: "cascade" }),
  riderUserId: uuid("rider_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
export const usersRelations = relations(users, ({ many }) => ({
  carpools: many(carpools),
  bookings: many(bookings),
  blocksAsDriver: many(driverBlocks, { relationName: "driverBlocks" }),
  blocksAsBlocked: many(driverBlocks, { relationName: "blockedByDrivers" }),
}));

export const carpoolsRelations = relations(carpools, ({ one, many }) => ({
  driver: one(users, {
    fields: [carpools.driverId],
    references: [users.id],
  }),
  bookings: many(bookings),
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
