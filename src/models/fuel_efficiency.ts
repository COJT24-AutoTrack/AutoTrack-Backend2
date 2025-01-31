export interface FuelEfficiency {
    fe_id: string
    car_id: string
    fe_date: string
    fe_amount: number
    fe_unitprice: number
    fe_mileage: number // 給油時のODOの表示値を保存
    created_at?: string
    updated_at?: string
}
