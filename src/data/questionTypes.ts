import type { DimensionCode } from "@/domain/dimensions";
import type { RoleId } from "@/domain/roles";

export interface FacilitatorInfo {
  why: string;
  followUp: string;
  strongSignals: string[];
  pitfalls: string[];
}

export interface Question {
  id: string;
  version: string;
  title: string;
  prompt: string;
  followUpPrompt: string;
  timeBudgetSeconds: number;
  dimensions: DimensionCode[];
  facilitator: FacilitatorInfo;
  quickScan: boolean;
  /** Ontbreekt voor de tien kernvragen; gezet voor rolspecifieke vragen. */
  role?: RoleId;
  kind: "CORE" | "ROLE_SPECIFIC";
}
