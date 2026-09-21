
import { z } from "zod";
import {ROLES} from "@/store/auth-store";
import {paginationFields, PaginationResponse} from "@/lib/validations/common";

const nameField = z.string().min(3).max(100)
const descriptionField = z.string().min(3).max(500)
const shortCodeField = z.string().min(3).max(5).toUpperCase()



const createSchema = z.object({
    name: nameField,
    description: descriptionField,
    shortCode: shortCodeField,
})

const updateSchema = z.object({
    name: nameField.optional(),
    description: descriptionField.optional(),
    shortCode: shortCodeField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
    name: nameField.optional(),
    description: descriptionField.optional(),
    shortCode: shortCodeField.optional(),
})

export type CreateCategory = {
    name: string
    description: string
    shortCode: string
}

export type UpdateCategory = {
    name?: string
    description?: string
    shortCode?: string
}


export type Category = {
    id: string;
    name: string;
    description: string;
    shortCode: string;
}


export type CategoryListResponse = {
    data: Category[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }


