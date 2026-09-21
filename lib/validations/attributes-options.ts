import { z } from "zod";
import {paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";

const valueField = z.string().max(100)
const orderField = z.number().int().optional()

const createSchema = z.object({
    attributeId: uuidField,
    value: valueField,
})

const updateSchema = z.object({
    value: valueField.optional(),
    order: orderField,
})

const getSchema = z.object({
    ...paginationFields.shape,
    attributeId: uuidField.optional(),
})

export type CreateAttributeOption = {
    attributeId: string
    value: string
}

export type UpdateAttributeOption = {
    value?: string
    order?: number
}


// opcje listy dla atrybutu typu SELECT
export type AttributeOption = {
    id: string;
    attributeId: string;
    value: string;
    order: number;
}


export type AttributeOptionListResponse = {
    data: AttributeOption[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
