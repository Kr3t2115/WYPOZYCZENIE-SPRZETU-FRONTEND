import { z } from "zod";
import {dateField, paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";

export const RENTAL_STATUSES = ["ACTIVE", "OVERDUE", "RETURNED", "LOST"] as const
export type RentalStatus = (typeof RENTAL_STATUSES)[number]

export const RENTAL_CREATION_MODES = {
    FROM_RESERVATION: "FROM_RESERVATION",
    MANUAL: "MANUAL",
} as const

const statusField = z.enum(RENTAL_STATUSES)

const fromReservationSchema = z.object({
    mode: z.literal(RENTAL_CREATION_MODES.FROM_RESERVATION),
    reservationId: uuidField,
})

const manualSchema = z.object({
    mode: z.literal(RENTAL_CREATION_MODES.MANUAL),
    studentId: uuidField,
    equipmentId: uuidField,
    startDate: dateField,
    dueDate: dateField,
})

const createSchema = z.discriminatedUnion("mode", [
    fromReservationSchema,
    manualSchema,
])

const updateSchema = z.object({
    status: statusField.optional(),
    returnedAt: dateField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
    equipmentId: uuidField.optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    status: statusField.optional(),
    studentId: uuidField.optional(),
    issuedBy: uuidField.optional(),
    receivedBy: uuidField.optional(),
    returnedAt: dateField.optional(),
})

// daty w requestach: "dd-mm-yyyy"
export type CreateRental =
    | {
    mode: typeof RENTAL_CREATION_MODES.FROM_RESERVATION
    reservationId: string
}
    | {
    mode: typeof RENTAL_CREATION_MODES.MANUAL
    studentId: string
    equipmentId: string
    startDate: string
    dueDate: string
}

export type UpdateRental = {
    status?: RentalStatus
    returnedAt?: string
}


export type Rental = {
    id: string;
    studentId: string;
    equipmentId: string;
    startDate: string;
    dueDate: string;
    returnedAt: string | null;
    status: RentalStatus;
    createdAt: string;
    updatedAt: string;
    issuedBy: string;
    receivedBy: string | null;
    // null = wypożyczenie bezpośrednio na miejscu (bez rezerwacji online)
    reservationId: string | null;
}


export type RentalListResponse = {
    data: Rental[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
