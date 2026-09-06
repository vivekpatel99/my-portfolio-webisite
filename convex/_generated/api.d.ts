/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as crons from "../crons.js";
import type * as leads from "../leads.js";
import type * as lib_inquiryContext from "../lib/inquiryContext.js";
import type * as lib_leadValidation from "../lib/leadValidation.js";
import type * as migrations_importLeads from "../migrations/importLeads.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  leads: typeof leads;
  "lib/inquiryContext": typeof lib_inquiryContext;
  "lib/leadValidation": typeof lib_leadValidation;
  "migrations/importLeads": typeof migrations_importLeads;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
