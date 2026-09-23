export interface ICreateZone {
  name: string;
  code: string;
  region: string;
  maxCapacityMW?: number;
  currentLoadMW?: number;
}

export interface ICreateSubstation {
  name: string;
  code: string;
  zoneId: string;
  capacityMVA?: number;
}

export interface ICreateFeeder {
  name: string;
  code: string;
  substationId: string;
  currentDemandMW?: number;
  maxLimitMW?: number;
  status?: 'ACTIVE' | 'LOAD_SHEDDING' | 'TRIPPED' | 'MAINTENANCE';
}

export interface IUpdateFeederStatus {
  status: 'ACTIVE' | 'LOAD_SHEDDING' | 'TRIPPED' | 'MAINTENANCE';
  reason?: string;
}
