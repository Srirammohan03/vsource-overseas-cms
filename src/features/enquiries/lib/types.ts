export type EnquiryStatus = "NEW" | "CONTACTED" | "IN_PROGRESS" | "CONVERTED" | "CLOSED";

export type EnquiryRecord = {
  id: string;
  enquiryNumber: number;
  studentName: string;
  phone: string;
  serviceRequired: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export type EnquirySummary = {
  total: number;
  NEW: number;
  CONTACTED: number;
  IN_PROGRESS: number;
  CONVERTED: number;
  CLOSED: number;
};
