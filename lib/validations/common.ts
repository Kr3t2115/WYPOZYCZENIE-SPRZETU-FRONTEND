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

export type PaginationResponse = {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
}

export {
    uuidField,
    idParamsSchema,
    paginationFields,
    queryBoolean,
    idWithOptionalTokenSchema,
}
