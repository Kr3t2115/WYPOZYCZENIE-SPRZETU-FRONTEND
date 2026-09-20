import { z } from 'zod'
import {paginationFields, PaginationResponse, queryBoolean} from './common'
import {ROLE_TYPE, ROLES} from "@/store/auth-store";

const firstNameField = z.string().min(1).max(100)
const lastNameField = z.string().min(1).max(100)
const isActiveField = queryBoolean
const roleField = z.enum(ROLES)

const updateSchema = z.object({
    isActive: isActiveField.optional(),
    role: roleField.optional(),
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
    isActive: isActiveField.optional(),
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

export type User = {
    id: string;
    isActive: boolean,
    role: ROLE_TYPE
    firstName: string,
    lastName: string,
    email: string,
}


export type UserListResponse = {
    data: User[];
    meta: PaginationResponse
};


export { updateSchema, getSchema }
