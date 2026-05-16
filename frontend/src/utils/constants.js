export const API_BASE_URL = 'http://localhost:8000/api';

export const ROLES = {
  ADMIN: 'Admin',
  AUTHOR: 'Author',
  REVIEWER: 'Reviewer',
  EMPLOYEE: 'Employee'
};

export const ARTICLE_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived'
};

export const STATUS_COLORS = {
  'Draft': 'gray',
  'Pending Approval': 'yellow',
  'Approved': 'green',
  'Rejected': 'red',
  'Archived': 'purple'
};

export const FILE_TYPES = ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'PNG', 'JPG', 'JPEG'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
