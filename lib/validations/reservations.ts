import { z } from "zod";
import {dateField, paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";

export const RESERVATION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

const statusField = z.enum(RESERVATION_STATUSES)
const notesField = z.string().min(1).max(1000).optional()
const rejectReasonField = z.string().min(1).max(1000).optional()

const createSchema = z.object({
    equipmentId: uuidField,
    startDate: dateField,
    endDate: dateField,
    notes: notesField,
})

const updateSchema = z.object({
    // przez studenta
    equipmentId: uuidField.optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    status: statusField.optional(),
    notes: notesField,

    // przez sekretariat
    rejectReason: rejectReasonField,
    reviewedBy: uuidField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
    equipmentId: uuidField.optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    status: statusField.optional(),
    reviewedBy: uuidField.optional(),
    studentId: uuidField.optional(),
})

// daty w requestach: "dd-mm-yyyy"
export type CreateReservation = {
    equipmentId: string
    startDate: string
    endDate: string
    notes?: string
}

export type UpdateReservation = {
    // przez studenta
    equipmentId?: string
    startDate?: string
    endDate?: string
    status?: ReservationStatus
    notes?: string

    // przez sekretariat
    rejectReason?: string
    reviewedBy?: string
}


export type Reservation = {
    id: string;
    studentId: string;
    equipmentId: string;
    startDate: string;
    endDate: string;
    status: ReservationStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
}


export type ReservationListResponse = {
    data: Reservation[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
