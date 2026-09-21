import { z } from "zod";
import {paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";

export const INSPECTION_TYPES = ["CHECKOUT", "RETURN"] as const
export type InspectionType = (typeof INSPECTION_TYPES)[number]

const notesField = z.string().min(10).max(1000)
const typeField = z.enum(INSPECTION_TYPES)

const createSchema = z.object({
    rentalId: uuidField,
    notes: notesField.optional(),
    type: typeField,
})

const updateSchema = z.object({
    notes: notesField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
})

export type CreateRentalInspection = {
    rentalId: string
    notes?: string
    type: InspectionType
}

export type UpdateRentalInspection = {
    notes?: string
}


export type InspectionPhoto = {
    id: string;
    inspectionId: string;
    path: string;
    createdAt: string;
}

// wiersz zwracany po insert / update
export type RentalInspection = {
    id: string;
    rentalId: string;
    type: InspectionType;
    notes: string | null;
    inspectedBy: string;
    uploadToken: string | null;
    uploadTokenExpiry: string | null;
    createdAt: string;
}

// getById i lista dołączają zdjęcia
export type RentalInspectionDetails = RentalInspection & {
    photos: InspectionPhoto[];
}


export type RentalInspectionListResponse = {
    data: RentalInspectionDetails[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
