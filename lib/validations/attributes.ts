import { z } from "zod";
import {paginationFields, PaginationResponse} from "@/lib/validations/common";
import {AttributeOption} from "@/lib/validations/attributes-options";

export const ATTRIBUTE_TYPES = ["TEXT", "NUMBER", "SELECT", "DATE", "BOOLEAN"] as const
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number]

const nameField = z.string().min(3).max(100)
const typeField = z.enum(ATTRIBUTE_TYPES)
const unitField = z.string().min(1).max(5).optional()

const createSchema = z.object({
    name: nameField,
    type: typeField,
    unit: unitField,
})

const updateSchema = z.object({
    name: nameField.optional(),
    type: typeField.optional(),
    unit: unitField,
})

const getSchema = z.object({
    ...paginationFields.shape,
    name: nameField.optional(),
    type: typeField.optional(),
    unit: unitField,
})

export type CreateAttribute = {
    name: string
    type: AttributeType
    unit?: string
}

export type UpdateAttribute = {
    name?: string
    type?: AttributeType
    unit?: string
}


// wiersz zwracany po insert / update i na liście
export type Attribute = {
    id: string;
    name: string;
    type: AttributeType;
    unit: string | null;
}

// getById dołącza opcje listy
export type AttributeDetails = Attribute & {
    options: AttributeOption[];
}


export type AttributeListResponse = {
    data: Attribute[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
