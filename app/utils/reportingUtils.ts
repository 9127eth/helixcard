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
 * Generate quarterly report for a specific group
 */
export async function generateGroupQuarterlyReport(
  groupName: string,
  year: number,
  quarter: number
): Promise<GroupReport> {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  
  // Query users in this group who registered in the quarter
  const usersSnapshot = await db.collection('users')
    .where('group', '==', groupName)
    .where('registeredAt', '>=', startDate)
    .where('registeredAt', '<=', endDate)
    .get();
  
  const users: UserReportData[] = [];
  let proUsers = 0;
  let freeUsers = 0;
  
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const user: UserReportData = {
      uid: doc.id,
      email: userData.email,
      username: userData.username,
      group: userData.group,
      source: userData.source,
      couponUsed: userData.couponUsed,
      isPro: userData.isPro || false,
      isProType: userData.isProType,
      registeredAt: userData.registeredAt?.toDate(),
      subscriptionCreatedAt: userData.subscriptionCreatedAt?.toDate()
    };
    
    users.push(user);
    
    if (user.isPro) {
      proUsers++;
    } else {
      freeUsers++;
    }
  });
  
  return {
    groupName,
    totalUsers: users.length,
    proUsers,
    freeUsers,
    users
  };
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
  
  // Get all available groups
  const groups = getAllGroups();
  
  // Generate reports for each group
  const groupReports: GroupReport[] = [];
  for (const group of groups) {
    const groupReport = await generateGroupQuarterlyReport(group, year, quarter);
    if (groupReport.totalUsers > 0) {
      groupReports.push(groupReport);
    }
  }
  
  // Get ungrouped users (users without a group)
  const ungroupedSnapshot = await db.collection('users')
    .where('registeredAt', '>=', startDate)
    .where('registeredAt', '<=', endDate)
    .get();
  
  const ungroupedUsers: UserReportData[] = [];
  
  ungroupedSnapshot.forEach(doc => {
    const userData = doc.data();
    
    // Only include users without a group
    if (!userData.group) {
      const user: UserReportData = {
        uid: doc.id,
        email: userData.email,
        username: userData.username,
        group: userData.group,
        source: userData.source,
        couponUsed: userData.couponUsed,
        isPro: userData.isPro || false,
        isProType: userData.isProType,
        registeredAt: userData.registeredAt?.toDate(),
        subscriptionCreatedAt: userData.subscriptionCreatedAt?.toDate()
      };
      
      ungroupedUsers.push(user);
    }
  });
  
  // Calculate total users
  const totalUsers = groupReports.reduce((sum, report) => sum + report.totalUsers, 0) + ungroupedUsers.length;
  
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
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
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
    csvContent += row.map(field => `"${field}"`).join(',') + '\n';
  }
  
  return csvContent;
} 