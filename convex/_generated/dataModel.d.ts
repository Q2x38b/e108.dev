/* eslint-disable */
import type { DataModelFromSchemaDefinition } from "convex/server";
import type schema from "../schema.js";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
