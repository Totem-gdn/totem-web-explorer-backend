export interface MessageRecord {
  id?: string;
  subject: string;
  type: string;
  date: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
}
