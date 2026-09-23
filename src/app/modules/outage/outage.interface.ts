export interface ICreateOutageReport {
  title: string;
  description: string;
  feederId: string;
  areaId: string;
  outageType?:
    | 'UNPLANNED'
    | 'FEEDER_TRIP'
    | 'TRANSFORMER_FAILURE'
    | 'CABLE_FAULT'
    | 'SCHEDULED_SHED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  photoUrl?: string;
}

export interface IAssignTechnician {
  technicianId: string;
  estimatedRestorationHours?: number;
  dispatchNotes?: string;
}

export interface IUpdateOutageStatus {
  status:
    | 'REPORTED'
    | 'VERIFIED'
    | 'TECHNICIAN_ASSIGNED'
    | 'EN_ROUTE'
    | 'REPAIR_IN_PROGRESS'
    | 'RESTORED'
    | 'CANCELLED';
  notes?: string;
  resolutionNotes?: string;
}

export interface IOutageFilterQuery {
  status?: string;
  severity?: string;
  feederId?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}
