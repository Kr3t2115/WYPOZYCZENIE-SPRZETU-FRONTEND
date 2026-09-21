import { z } from "zod";
import {paginationFields, PaginationResponse, queryBoolean, uuidField} from "@/lib/validations/common";
import {Category} from "@/lib/validations/category";
import {Attribute} from "@/lib/validations/attributes";

const requiredField = z.boolean().optional()
const orderField = z.number().int().optional()

const createSchema = z.object({
    categoryId: uuidField,
    attributeId: uuidField,
    required: requiredField,
})

const updateSchema = z.object({
    categoryId: uuidField.optional(),
    attributeId: uuidField.optional(),
    required: requiredField,
    order: orderField,
})

const getSchema = z.object({
    ...paginationFields.shape,
    categoryId: uuidField.optional(),
    attributeId: uuidField.optional(),
    required: queryBoolean,
})

// required domyślnie true, order nadaje backend przy tworzeniu
export type CreateCategoryAttribute = {
    categoryId: string
    attributeId: string
    required?: boolean
}

export type UpdateCategoryAttribute = {
    categoryId?: string
    attributeId?: string
    required?: boolean
    order?: number
}


// wiersz zwracany po insert / update
export type CategoryAttribute = {
    id: string;
    categoryId: string;
    attributeId: string;
    required: boolean;
    order: number;
}

// getById i lista dołączają kategorię i atrybut
export type CategoryAttributeDetails = CategoryAttribute & {
    category: Category;
    attribute: Attribute;
}


export type CategoryAttributeListResponse = {
    data: CategoryAttributeDetails[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
