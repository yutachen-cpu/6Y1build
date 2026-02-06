
export enum EventStatus {
  RESERVATION = '預約',
  REQUIREMENT_CONFIRM = '需求確認',
  PLANNING = '規劃',
  PREPARATION = '備檔',
  TESTING = '測試',
  PACKING = '點交打包',
  EXHIBITION = '展出',
  DISMANTLE = '撤展點交',
  ENDED = '結束'
}

export enum EquipmentStatus {
  PENDING = '待確認',
  NORMAL = '正常',
  MINOR_DEFECT = '微缺陷',
  REPAIR = '維修中',
  LOST = '遺失',
  PURCHASE = '需採購'
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  owner: string;
  imageUrl: string;
  stock: number;
  unit: string;
  status: EquipmentStatus;
  dimensions: string; // L x W x H
  weight: string; // kg
  description: string;
  extraProps?: {
    footprint?: string;
    network?: boolean;
    audio?: boolean;
    notes?: string;
  };
}

export interface Allocation {
  equipmentId: string;
  quantity: number;
  checkedOutCount: number; // For checklist
  checkedInCount: number;  // For checklist
  note?: string; // Added note field
}

export interface AdHocItem {
  id: string;
  name: string;
  quantity: number;
  checkedOut: boolean;
  checkedIn: boolean;
  note: string;
}

export interface WorkflowItem {
  id: string;
  category: string; // e.g. 攤位確認
  label: string;    // e.g. 確認攤位位置與尺寸
  isCompleted: boolean;
  note: string;
}

export interface EventLogistics {
  requester: string;      // 需求方 (單位/公司)
  contactPerson: string;  // 聯絡人 (姓名)
  location: string;
  personnel: string;
  truckInfo: string;
  setupTime: string;      // ISO String or DateTime string
  teardownTime: string;   // ISO String or DateTime string
}

export interface Event {
  id: string;
  title: string;
  category: 'Client' | 'Exhibition' | 'Internal';
  status: EventStatus;
  startDate: string; // ISO String
  endDate: string;   // ISO String
  displayContent?: string; // 展示內容
  logistics: EventLogistics;
  allocations: Allocation[];
  adHocItems?: AdHocItem[]; 
  workflow?: WorkflowItem[]; // 籌備流程節點
  signatures?: {
    checkOut?: string; // Base64 image
    checkIn?: string;  // Base64 image
  };
  createdAt: number;
}

export interface ConflictAlert {
  date: string;
  equipmentId: string;
  equipmentName: string;
  shortage: number;
  totalDemand: number;
  totalStock: number;
  relatedEventTitles: string[]; // Added to track which events cause the conflict
  relatedEventIds: string[];
}
