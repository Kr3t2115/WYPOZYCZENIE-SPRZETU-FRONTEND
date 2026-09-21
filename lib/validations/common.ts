import { z } from 'zod'

const uuidField = z.string().uuid()

const idParamsSchema = z.object({
    id: uuidField,
})

const idWithOptionalTokenSchema = idParamsSchema.extend({
    token: z.string().min(10).optional(),
})

const queryBoolean = z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()

const pageField = z.coerce.number().int().positive().optional()
const limitField = z.coerce.number().int().positive().optional()

const paginationFields = z.object({
    page: pageField,
    limit: limitField,
})

// Backend przyjmuje daty w requestach jako "dd-mm-yyyy" (a zwraca ISO string)
const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/

const dateField = z
    .string()
    .regex(dateRegex, { message: 'Data musi być w formacie dd-mm-yyyy' })
    .refine(
        (val) => {
            const [, day, month, year] = val.match(dateRegex) ?? []
            const date = new Date(Number(year), Number(month) - 1, Number(day))

            return (
                date.getFullYear() === Number(year) &&
                date.getMonth() === Number(month) - 1 &&
                date.getDate() === Number(day)
            )
        },
        { message: 'Nieprawidłowa data' }
    )

export type PaginationResponse = {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
}

export type MessageResponse = {
    message: string,
}

// Prisma createMany - liczba zapisanych zdjęć
export type PhotoUploadResponse = {
    count: number,
}

export type UploadTokenResponse = {
    uploadUrl: string,
}

export {
    uuidField,
    idParamsSchema,
    paginationFields,
    queryBoolean,
    idWithOptionalTokenSchema,
    dateField,
}
