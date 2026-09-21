import { z } from "zod";
import {dateField, paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";

export const EXTENSION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const
export type ExtensionStatus = (typeof EXTENSION_STATUSES)[number]

const rejectReasonField = z.string().min(1).max(1000)
const statusField = z.enum(EXTENSION_STATUSES)

const createSchema = z.object({
    rentalId: uuidField,
    newDueDate: dateField,
})

const updateSchema = z.object({
    rejectReason: rejectReasonField.optional(),
    status: statusField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
})

// newDueDate w requeście: "dd-mm-yyyy"
export type CreateRentalExtension = {
    rentalId: string
    newDueDate: string
}

export type UpdateRentalExtension = {
    rejectReason?: string
    status?: ExtensionStatus
}


export type RentalExtension = {
    id: string;
    rentalId: string;
    newDueDate: string;
    status: ExtensionStatus;
    requestedAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
}


export type RentalExtensionListResponse = {
    data: RentalExtension[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
