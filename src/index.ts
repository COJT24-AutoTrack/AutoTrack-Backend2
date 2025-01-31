import { Hono } from 'hono'
import { verifyFirebaseAuth } from '@hono/firebase-auth'
import { cors } from 'hono/cors'
import { carRoutes } from './routes/cars'
import { userRoutes } from './routes/users'
import { tuningRoutes } from './routes/tunings'
import { fuelEfficiencyRoutes } from './routes/fuel_efficiencies'
import { accidentsRoutes } from './routes/accidents'
import { imagesRoutes } from './routes/images'
import { maintenancesRoutes } from './routes/maintenances'
import { periodicInspectionsRoutes } from './routes/periodic_inspections'

export interface Bindings {
    R2_SECRET_ACCESS_KEY: string
    R2_ACCESS_KEY_ID: string
    R2_ENDPOINT_URL: string
    BUCKET_NAME: string
    DB: D1Database
    FIREBASE_PROJECT_ID: string
    PUBLIC_JWK_CACHE_KEY: string
    PUBLIC_JWK_CACHE_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()
    .use('*', cors())
    .use('*', async (c, next) => {
        const projectId = c.env.FIREBASE_PROJECT_ID
        if (!projectId) {
            return c.json(
                {
                    code: 'config/missing-project-id',
                    message: 'Firebase project ID is missing.',
                },
                500,
            )
        }
        return verifyFirebaseAuth({ projectId })(c, next)
    })
    .basePath('/api')
    .route('/accidents', accidentsRoutes)
    .route('/cars', carRoutes)
    .route('/fuel_efficiencies', fuelEfficiencyRoutes)
    .route('/images', imagesRoutes)
    .route('/maintenances', maintenancesRoutes)
    .route('/periodic_inspections', periodicInspectionsRoutes)
    .route('/tunings', tuningRoutes)
    .route('/users', userRoutes)

    .get('/', (c) => c.text('AutoTrack API Running'))

export default app
