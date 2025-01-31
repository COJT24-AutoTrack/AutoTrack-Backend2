export interface Maintenance {
    maint_id: string
    car_id: string
    maint_type: MaintType
    maint_title: string
    maint_date: string
    maint_description: string
    created_at?: string
    updated_at?: string
}

enum MaintType {
    OilChange = 'Oil Change',
    OilFilterChange = 'Oil Filter Change',
    HeadlightChange = 'Headlight Change',
    PositionLampChange = 'Position Lamp Change',
    FogLampChange = 'Fog Lamp Change',
    TurnSignalChange = 'Turn Signal Change',
    BrakeLightChange = 'Brake Light Change',
    LicensePlateLightChange = 'License Plate Light Change',
    BackupLightChange = 'Backup Light Change',
    CarWash = 'Car Wash',
    WiperBladeChange = 'Wiper Blade Change',
    BrakePadChange = 'Brake Pad Change',
    BrakeDiscChange = 'Brake Disc Change',
    TireChange = 'Tire Change',
    BatteryChange = 'Battery Change',
    TimingBeltChange = 'Timing Belt Change',
    CoolantRefill = 'Coolant Refill',
    WasherFluidRefill = 'Washer Fluid Refill',
    Other = 'Other',
}
