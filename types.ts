
export interface Worker {
  category?: string;
  sNo?: string | number;
  nameEng?: string;
  nameAr?: string;
  gender?: string;
  nationality?: string;
  idNo?: string;
  empNo?: string;
  company?: string;
  position?: string;
  mrn?: string;
  area: string;
  zone: string;
}

export interface Inspector {
  name: string;
  note?: string;
}

export interface ZoneData {
  name: string;
  workers: Worker[];
}

export interface AreaData {
  name: string;
  totalWorkers: number;
  zones: ZoneData[];
}

export interface Assignment {
  inspector: Inspector;
  areas: AreaData[];
  totalWorkers: number;
}

export enum PlanCycle {
  WEEKLY = 'أسبوعي',
  MONTHLY = 'شهري',
  QUARTERLY = 'ربع سنوي',
  HALF_YEARLY = 'نصف سنوي'
}

export interface PlanConfig {
  cycle: PlanCycle;
  startDate: string;
}
