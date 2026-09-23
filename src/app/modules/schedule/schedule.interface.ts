export interface ICreateSchedule {
  title: string;
  feederId: string;
  startTime: string;
  endTime: string;
  targetDeficitMW?: number;
  recurringDays?: string[];
}

export interface IAutomatedScheduleGen {
  zoneId?: string;
  gridDeficitMW: number;
  durationHours: number;
  reason: string;
}

export interface IScheduleFilterQuery {
  feederId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
