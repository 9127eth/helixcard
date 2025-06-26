'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { QuarterlyReport, GroupReport } from '../utils/reportingUtils';

interface ReportParams {
  year: number;
  quarter: number;
  group?: string;
  format: 'json' | 'csv';
}

interface SuccessMessage {
  message: string;
}

export const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportParams, setReportParams] = useState<ReportParams>({
    year: new Date().getFullYear(),
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    format: 'json'
  });
  const [reportData, setReportData] = useState<QuarterlyReport | GroupReport | SuccessMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!user) {
      setError('You must be logged in to generate reports');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        year: reportParams.year.toString(),
        quarter: reportParams.quarter.toString(),
        format: reportParams.format
      });

      if (reportParams.group) {
        params.append('group', reportParams.group);
      }

      const response = await fetch(`/api/reports/quarterly?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      if (reportParams.format === 'csv') {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quarterly-report-${reportParams.year}-Q${reportParams.quarter}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setReportData({ message: 'CSV downloaded successfully' });
      } else {
        // Display JSON data
        const data = await response.json();
        setReportData(data.report);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const availableGroups = [
    'lipscomb-university',
    'ut-tyler',
    'vmcrx-partners',
    'nhma-members',
    'emprx-subscribers',
    'partner-network-1',
    'partner-network-2',
    'affiliate-program-1'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Admin Reports
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Generate Quarterly Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={reportParams.year}
              onChange={(e) => setReportParams(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quarter
            </label>
            <select
              value={reportParams.quarter}
              onChange={(e) => setReportParams(prev => ({ ...prev, quarter: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={1}>Q1 (Jan-Mar)</option>
              <option value={2}>Q2 (Apr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dec)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group (Optional)
            </label>
            <select
              value={reportParams.group || ''}
              onChange={(e) => setReportParams(prev => ({ ...prev, group: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Groups</option>
              {availableGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <select
              value={reportParams.format}
              onChange={(e) => setReportParams(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="json">JSON (View)</option>
              <option value="csv">CSV (Download)</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-300"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {reportData && reportParams.format === 'json' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Report Results
          </h3>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      )}

      {reportData && reportParams.format === 'csv' && 'message' in reportData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Success:</strong> {reportData.message}
        </div>
      )}
    </div>
  );
}; 