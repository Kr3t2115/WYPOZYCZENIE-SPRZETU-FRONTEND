import { z } from "zod";
import {paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";
import {EquipmentAttributeValue} from "@/lib/validations/equipment";

// TEXT/NUMBER/DATE/BOOLEAN -> value, SELECT -> attributeOptionId
const valueField = z.string().max(255).optional()
const attributeOptionIdField = uuidField.optional()

const createSchema = z.object({
    attributeId: uuidField,
    value: valueField,
    attributeOptionId: attributeOptionIdField,
})

const updateSchema = z.object({
    value: valueField,
    attributeOptionId: attributeOptionIdField,
})

const getSchema = z.object({
    ...paginationFields.shape,
    attributeId: uuidField.optional(),
    attributeOptionId: attributeOptionIdField,
})

export type CreateEquipmentAttribute = {
    attributeId: string
    value?: string
    attributeOptionId?: string
}

export type UpdateEquipmentAttribute = {
    value?: string
    attributeOptionId?: string
}


export type EquipmentAttributeListResponse = {
    data: EquipmentAttributeValue[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
