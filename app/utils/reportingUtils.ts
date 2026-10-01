// Reporting utilities for quarterly group reports
import { db } from '../lib/firebase-admin';
import { getAllGroups } from './groupMapping';

export interface UserReportData {
  uid: string;
  email?: string;
  username?: string;
  group?: string;
  source?: string;
  couponUsed?: string;
  isPro: boolean;
  isProType?: string;
  registeredAt?: Date;
  subscriptionCreatedAt?: Date;
}

export interface GroupReport {
  groupName: string;
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  users: UserReportData[];
}

export interface QuarterlyReport {
  quarter: string;
  year: number;
  startDate: Date;
  endDate: Date;
  totalUsers: number;
  groupReports: GroupReport[];
  ungroupedUsers: UserReportData[];
}

/**
 * Get quarter dates for a given year and quarter
 */
export function getQuarterDates(year: number, quarter: number): { startDate: Date; endDate: Date } {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Get current quarter
 */
export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  
  return { year, quarter };
}

/**
 * Users who registered in the quarter.
 *
 * Web and iOS sign-ups both stamp `createdAt`; nothing writes `registeredAt`.
 * A range on one field needs no composite index, so callers group in memory.
 */
async function getUsersRegisteredInQuarter(year: number, quarter: number): Promise<UserReportData[]> {
  const { startDate, endDate } = getQuarterDates(year, quarter);

  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  return usersSnapshot.docs.map(doc => {
    const userData = doc.data();
    return {
      uid: doc.id,
      email: userData.email,
      username: userData.username,
      group: userData.group,
      source: userData.source,
      couponUsed: userData.couponUsed,
      isPro: userData.isPro || false,
      isProType: userData.isProType,
      registeredAt: (userData.createdAt ?? userData.registeredAt)?.toDate(),
      subscriptionCreatedAt: userData.subscriptionCreatedAt?.toDate()
    };
  });
}

function buildGroupReport(groupName: string, users: UserReportData[]): GroupReport {
  const proUsers = users.filter(user => user.isPro).length;

  return {
    groupName,
    totalUsers: users.length,
    proUsers,
    freeUsers: users.length - proUsers,
    users
  };
}

/**
 * Generate quarterly report for a specific group
 */
export async function generateGroupQuarterlyReport(
  groupName: string,
  year: number,
  quarter: number
): Promise<GroupReport> {
  const users = await getUsersRegisteredInQuarter(year, quarter);
  return buildGroupReport(groupName, users.filter(user => user.group === groupName));
}

/**
 * Generate full quarterly report for all groups
 */
export async function generateQuarterlyReport(
  year: number,
  quarter: number
): Promise<QuarterlyReport> {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  const quarterString = `Q${quarter}`;
  const users = await getUsersRegisteredInQuarter(year, quarter);

  // Known groups keep their configured order. A group value missing from the
  // mapping (a retired partner, say) still gets its own report.
  const usersByGroup = new Map<string, UserReportData[]>(
    getAllGroups().map(group => [group, []])
  );
  const ungroupedUsers: UserReportData[] = [];

  for (const user of users) {
    if (!user.group) {
      ungroupedUsers.push(user);
      continue;
    }
    const groupUsers = usersByGroup.get(user.group) ?? [];
    groupUsers.push(user);
    usersByGroup.set(user.group, groupUsers);
  }

  const groupReports = Array.from(usersByGroup)
    .filter(([, groupUsers]) => groupUsers.length > 0)
    .map(([groupName, groupUsers]) => buildGroupReport(groupName, groupUsers));

  const totalUsers = users.length;
  
  return {
    quarter: quarterString,
    year,
    startDate,
    endDate,
    totalUsers,
    groupReports,
    ungroupedUsers
  };
}

/**
 * Neutralise a CSV cell before it reaches an administrator's spreadsheet.
 *
 * Users control fields such as `username` and `source`, and Excel / Sheets
 * execute any cell that starts with =, +, -, @, tab or carriage return. The
 * leading apostrophe keeps the value readable while stripping the formula, and
 * doubling internal quotes keeps the row valid per RFC 4180.
 */
function sanitizeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const escaped = text.replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(report: QuarterlyReport): string {
  const headers = [
    'Group',
    'User ID',
    'Email',
    'Username',
    'Source',
    'Coupon Used',
    'Is Pro',
    'Pro Type',
    'Registration Date',
    'Subscription Date'
  ];
  
  let csvContent = headers.join(',') + '\n';
  
  // Add grouped users
  for (const groupReport of report.groupReports) {
    for (const user of groupReport.users) {
      const row = [
        groupReport.groupName,
        user.uid,
        user.email || '',
        user.username || '',
        user.source || '',
        user.couponUsed || '',
        user.isPro.toString(),
        user.isProType || '',
        user.registeredAt?.toISOString() || '',
        user.subscriptionCreatedAt?.toISOString() || ''
      ];
      csvContent += row.map(field => `"${sanitizeCsvCell(field)}"`).join(',') + '\n';
    }
  }
  
  // Add ungrouped users
  for (const user of report.ungroupedUsers) {
    const row = [
      'Ungrouped',
      user.uid,
      user.email || '',
      user.username || '',
      user.source || '',
      user.couponUsed || '',
      user.isPro.toString(),
      user.isProType || '',
      user.registeredAt?.toISOString() || '',
      user.subscriptionCreatedAt?.toISOString() || ''
    ];
    csvContent += row.map(field => `"${sanitizeCsvCell(field)}"`).join(',') + '\n';
  }
  
  return csvContent;
} 