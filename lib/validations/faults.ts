import { z } from "zod";
import {paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";

export const FAULT_SEVERITIES = ["MINOR", "MODERATE", "CRITICAL"] as const
export type FaultSeverity = (typeof FAULT_SEVERITIES)[number]

export const FAULT_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"] as const
export type FaultStatus = (typeof FAULT_STATUSES)[number]

export const OCCURRENCE_TYPES = ["DURING_USE", "ON_PICKUP"] as const
export type OccurrenceType = (typeof OCCURRENCE_TYPES)[number]

const descriptionField = z.string().min(10).max(1000)
const resolveNoteField = z.string().min(10).max(1000)

const severityField = z.enum(FAULT_SEVERITIES)
const statusField = z.enum(FAULT_STATUSES)
const occurredDuringField = z.enum(OCCURRENCE_TYPES)

const createSchema = z.object({
    rentalId: uuidField,
    description: descriptionField,
    severity: severityField,
    occurredDuring: occurredDuringField,
})

const updateSchema = z.object({
    resolveNote: resolveNoteField.optional(),
    status: statusField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
})

export type CreateFault = {
    rentalId: string
    description: string
    severity: FaultSeverity
    occurredDuring: OccurrenceType
}

export type UpdateFault = {
    resolveNote?: string
    status?: FaultStatus
}


export type FaultPhoto = {
    id: string;
    faultId: string;
    path: string;
    createdAt: string;
}

// wiersz zwracany po insert / update
export type Fault = {
    id: string;
    rentalId: string;
    reportedBy: string;
    description: string;
    severity: FaultSeverity;
    status: FaultStatus;
    uploadToken: string | null;
    uploadTokenExpiry: string | null;
    occurredDuring: OccurrenceType;
    createdAt: string;
    updatedAt: string;
    resolvedBy: string | null;
    resolvedAt: string | null;
    resolveNote: string | null;
}

// getById i lista dołączają zdjęcia
export type FaultDetails = Fault & {
    photos: FaultPhoto[];
}


export type FaultListResponse = {
    data: FaultDetails[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
