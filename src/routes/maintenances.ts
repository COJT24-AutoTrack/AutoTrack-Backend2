import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

const MAINTENANCE_TITLES: Record<string, string> = {
    OilChange: 'Oil Change',
    TireRotation: 'Tire Rotation',
    BrakeInspection: 'Brake Inspection',
    Other: 'Other',
}

const MaintenanceSchema = z.object({
    car_id: z.number().int(),
    maint_type: z.string(),
    maint_title: z.string().optional(),
    maint_date: z.string().datetime(),
    maint_description: z.string(),
})

const applyMaintenanceLogic = (
    maintenance: z.infer<typeof MaintenanceSchema>,
) => {
    return {
        ...maintenance,
        maint_title:
            MAINTENANCE_TITLES[maintenance.maint_type] ||
            maintenance.maint_title,
    }
}
export const maintenancesRoutes = new Hono<{ Bindings: Bindings }>()
    .post('/', zValidator('json', MaintenanceSchema), async (c) => {
        try {
            const maintenanceData = applyMaintenanceLogic(await c.req.json())

            const insertStmt = await c.env.DB.prepare(
                `INSERT INTO Maintenances (car_id, maint_type, maint_title, maint_date, maint_description) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING maint_id`,
            )
                .bind(
                    maintenanceData.car_id,
                    maintenanceData.maint_type,
                    maintenanceData.maint_title,
                    maintenanceData.maint_date,
                    maintenanceData.maint_description,
                )
                .run()

            const maint_id = insertStmt.meta.last_row_id
            if (!maint_id) {
                return c.json({ error: 'Failed to insert maintenance' }, 500)
            }

            const maintenance = await c.env.DB.prepare(
                `SELECT * FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .first()

            return c.json(maintenance, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            console.error('Error creating maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
    .get('/', async (c) => {
        try {
            const maintenances = await c.env.DB.prepare(
                `SELECT * FROM Maintenances`,
            ).all()
            return c.json(maintenances.results, 200)
        } catch (err) {
            console.error('Error fetching maintenances:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
    .get('/:maint_id', async (c) => {
        try {
            const maint_id = parseInt(c.req.param('maint_id'), 10)
            if (isNaN(maint_id)) {
                return c.json({ error: 'Invalid maint_id' }, 400)
            }

            const maintenance = await c.env.DB.prepare(
                `SELECT * FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .first()

            if (!maintenance) {
                return c.json({ error: 'Maintenance not found' }, 404)
            }

            return c.json(maintenance, 200)
        } catch (err) {
            console.error('Error fetching maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
    .put('/:maint_id', zValidator('json', MaintenanceSchema), async (c) => {
        try {
            const maint_id = parseInt(c.req.param('maint_id'), 10)
            if (isNaN(maint_id)) {
                return c.json({ error: 'Invalid maint_id' }, 400)
            }

            const maintenanceData = applyMaintenanceLogic(await c.req.json())

            const result = await c.env.DB.prepare(
                `UPDATE Maintenances SET car_id = ?1, maint_type = ?2, maint_title = ?3, maint_date = ?4, maint_description = ?5 WHERE maint_id = ?6`,
            )
                .bind(
                    maintenanceData.car_id,
                    maintenanceData.maint_type,
                    maintenanceData.maint_title,
                    maintenanceData.maint_date,
                    maintenanceData.maint_description,
                    maint_id,
                )
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Maintenance not found or not updated' },
                    404,
                )
            }

            const updatedMaintenance = await c.env.DB.prepare(
                `SELECT * FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .first()

            return c.json(updatedMaintenance, 200)
        } catch (err) {
            console.error('Error updating maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
    .delete('/:maint_id', async (c) => {
        try {
            const maint_id = parseInt(c.req.param('maint_id'), 10)
            if (isNaN(maint_id)) {
                return c.json({ error: 'Invalid maint_id' }, 400)
            }

            const result = await c.env.DB.prepare(
                `DELETE FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Maintenance not found' }, 404)
            }

            return new Response(null, { status: 204 })
        } catch (err) {
            console.error('Error deleting maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
