import { z } from 'zod'
import {paginationFields, PaginationResponse, queryBoolean} from './common'
import {ROLE_TYPE, ROLES} from "@/store/auth-store";

const firstNameField = z.string().min(1).max(100)
const lastNameField = z.string().min(1).max(100)
// w body (PATCH) backend oczekuje zwykłego booleana, a w query string (GET) stringów "true"/"false"
const isActiveField = z.boolean()
const isActiveQueryField = queryBoolean
const roleField = z.enum(ROLES)

const updateSchema = z.object({
    isActive: isActiveField.optional(),
    role: roleField.optional(),
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
    isActive: isActiveQueryField.optional(),
    role: roleField.optional(),
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
})


export type UpdateUser = {
    isActive?: boolean,
    role?: ROLE_TYPE
    firstName?: string,
    lastName?: string,
}

// pola z `select` w users.repository (list / getById)
export type User = {
    id: string;
    email: string,
    role: ROLE_TYPE
    isActive: boolean,
    lastLogin: string | null,
}


export type UserListResponse = {
    data: User[];
    meta: PaginationResponse
};


export { updateSchema, getSchema }
