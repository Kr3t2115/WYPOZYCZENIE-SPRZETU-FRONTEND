import { z } from "zod";
import {paginationFields, PaginationResponse, uuidField} from "@/lib/validations/common";
import {Category} from "@/lib/validations/category";

export const EQUIPMENT_STATUSES = ["AVAILABLE", "RENTED", "MAINTENANCE", "RETIRED"] as const
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]

const nameField = z.string().min(3).max(100)
const serialNumberField = z.string().min(3).max(100)
const inventoryNumberField = z.string().min(3).max(20)
const statusField = z.enum(EQUIPMENT_STATUSES)

const createSchema = z.object({
    name: nameField,
    serialNumber: serialNumberField,
    categoryId: uuidField,
})

const updateSchema = z.object({
    name: nameField.optional(),
    status: statusField.optional(),
    serialNumber: serialNumberField.optional(),
    categoryId: uuidField.optional(),
})

const getSchema = z.object({
    ...paginationFields.shape,
    name: nameField.optional(),
    status: statusField.optional(),
    inventoryNumber: inventoryNumberField.optional(),
    serialNumber: serialNumberField.optional(),
    categoryId: uuidField.optional(),
})

export type CreateEquipment = {
    name: string
    serialNumber: string
    categoryId: string
}

export type UpdateEquipment = {
    name?: string
    status?: EquipmentStatus
    serialNumber?: string
    categoryId?: string
}


// wartość atrybutu sprzętu (TEXT/NUMBER/DATE/BOOLEAN -> value, SELECT -> attributeOptionId)
export type EquipmentAttributeValue = {
    id: string;
    equipmentId: string;
    attributeId: string;
    value: string | null;
    attributeOptionId: string | null;
}

// wiersz zwracany po insert / update
export type Equipment = {
    id: string;
    name: string;
    serialNumber: string | null;
    inventoryNumber: string;
    categoryId: string;
    status: EquipmentStatus;
    createdAt: string;
}

// getById i lista dołączają kategorię i wartości atrybutów
export type EquipmentDetails = Equipment & {
    category: Category;
    values: EquipmentAttributeValue[];
}


export type EquipmentListResponse = {
    data: EquipmentDetails[];
    meta: PaginationResponse
};


export { createSchema, updateSchema, getSchema }
