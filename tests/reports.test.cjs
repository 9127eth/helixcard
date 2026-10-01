const { beforeEach, mock, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText, filename);
  };
}

/** Stands in for the Admin SDK's Timestamp, which is what `createdAt` reads back as. */
class Timestamp {
  constructor(date) {
    this.millis = date.getTime();
  }

  toDate() {
    return new Date(this.millis);
  }
}

const users = new Map();
const queries = [];

const RANGE_OPS = new Set(['<', '<=', '>', '>=']);

function matches(value, op, bound) {
  if (op === '==') return value === bound;
  // Firestore orders by type first, so a Date range only ever matches timestamps.
  if (!(value instanceof Timestamp) || !(bound instanceof Date)) return false;
  const left = value.millis;
  const right = bound.getTime();
  if (op === '<') return left < right;
  if (op === '<=') return left <= right;
  if (op === '>') return left > right;
  return left >= right;
}

function usersQuery(clauses) {
  return {
    where(field, op, value) {
      return usersQuery([...clauses, { field, op, value }]);
    },
    async get() {
      queries.push(clauses);
      const fields = new Set(clauses.map(clause => clause.field));
      // firestore.indexes.json declares no composite indexes, so a range next
      // to a filter on another field fails in production.
      if (fields.size > 1 && clauses.some(clause => RANGE_OPS.has(clause.op))) {
        throw new Error('9 FAILED_PRECONDITION: The query requires an index.');
      }
      const docs = Array.from(users)
        .filter(([, data]) => clauses.every(clause => matches(data[clause.field], clause.op, clause.value)))
        .map(([id, data]) => ({ id, data: () => data }));
      return { docs, size: docs.length, empty: docs.length === 0, forEach: fn => docs.forEach(fn) };
    },
  };
}

const db = {
  collection(name) {
    assert.equal(name, 'users');
    return usersQuery([]);
  },
};

class NextResponse extends Response {
  static json(body, init) {
    return Response.json(body, init);
  }
}

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === 'next/server') return { NextResponse };
  if (request === '@/app/lib/adminAuth') {
    return { verifyAdminAccess: async token => (token === 'admin-token' ? { uid: 'admin' } : null) };
  }
  if (request.endsWith('/firebase-admin')) return { db };
  if (request.startsWith('@/')) {
    return originalLoad(path.join(ROOT, request.slice(2)), parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};

const {
  exportReportToCSV,
  generateGroupQuarterlyReport,
  generateQuarterlyReport,
} = require(path.join(ROOT, 'app/utils/reportingUtils.ts'));
const { GET } = require(path.join(ROOT, 'app/api/reports/quarterly/route.ts'));

// Seeded dates use local time, as getQuarterDates does, so the quarter edges
// hold in any time zone.
const Q3_2026 = { year: 2026, quarter: 3 };

function seedUser(uid, createdAt, fields = {}) {
  users.set(uid, {
    email: `${uid}@example.com`,
    username: uid,
    isPro: false,
    isProType: 'free',
    ...(createdAt && { createdAt: new Timestamp(createdAt) }),
    ...fields,
  });
}

function allReportedUids(report) {
  return [
    ...report.groupReports.flatMap(groupReport => groupReport.users.map(user => user.uid)),
    ...report.ungroupedUsers.map(user => user.uid),
  ];
}

function reportRequest(query = '') {
  return new Request(`https://www.helixcard.app/api/reports/quarterly${query}`, {
    headers: { Authorization: 'Bearer admin-token' },
  });
}

beforeEach(() => {
  users.clear();
  queries.length = 0;
});

test('reports users created in the quarter and skips everyone outside it', async () => {
  seedUser('mid-quarter', new Date(2026, 7, 15, 12));
  seedUser('first-moment', new Date(2026, 6, 1, 0, 0, 0, 0));
  seedUser('last-moment', new Date(2026, 8, 30, 23, 59, 59, 999));
  seedUser('previous-quarter', new Date(2026, 5, 30, 23, 59, 59, 999));
  seedUser('next-quarter', new Date(2026, 9, 1, 0, 0, 0, 0));
  // What a racing email sync left behind: no createdAt, so no registration date.
  users.set('bare-stub', { email: 'bare-stub@example.com', updatedAt: new Timestamp(new Date(2026, 7, 1)) });

  const report = await generateQuarterlyReport(Q3_2026.year, Q3_2026.quarter);

  assert.deepEqual(allReportedUids(report).sort(), ['first-moment', 'last-moment', 'mid-quarter']);
  assert.equal(report.totalUsers, 3);
  assert.equal(queries.length, 1, 'the full report reads the quarter once');
});

test('a group missing from the mapping still gets a report', async () => {
  seedUser('known', new Date(2026, 7, 2), { group: 'lipscomb-university' });
  seedUser('retired', new Date(2026, 7, 3), { group: 'retired-partner', isPro: true, isProType: 'lifetime' });

  const report = await generateQuarterlyReport(Q3_2026.year, Q3_2026.quarter);

  assert.deepEqual(
    report.groupReports.map(({ groupName, totalUsers, proUsers, freeUsers, users: groupUsers }) => ({
      groupName, totalUsers, proUsers, freeUsers, uids: groupUsers.map(user => user.uid),
    })),
    [
      { groupName: 'lipscomb-university', totalUsers: 1, proUsers: 0, freeUsers: 1, uids: ['known'] },
      { groupName: 'retired-partner', totalUsers: 1, proUsers: 1, freeUsers: 0, uids: ['retired'] },
    ]
  );
  assert.equal(report.totalUsers, 2);
  assert.deepEqual(report.ungroupedUsers, []);
});

test('ungrouped users are counted once and grouped users never appear as ungrouped', async () => {
  seedUser('solo-1', new Date(2026, 6, 10));
  seedUser('solo-2', new Date(2026, 8, 1), { group: '' });
  seedUser('grouped', new Date(2026, 7, 20), { group: 'ut-tyler', isPro: true, isProType: 'yearly' });

  const report = await generateQuarterlyReport(Q3_2026.year, Q3_2026.quarter);
  const uids = allReportedUids(report);

  assert.deepEqual(report.ungroupedUsers.map(user => user.uid).sort(), ['solo-1', 'solo-2']);
  assert.equal(new Set(uids).size, uids.length, 'no user is listed twice');
  assert.equal(
    report.totalUsers,
    report.groupReports.reduce((sum, groupReport) => sum + groupReport.totalUsers, 0) + report.ungroupedUsers.length
  );
  assert.equal(report.totalUsers, 3);
  assert.deepEqual(
    report.groupReports.map(({ groupName, totalUsers, proUsers, freeUsers }) => ({ groupName, totalUsers, proUsers, freeUsers })),
    [{ groupName: 'ut-tyler', totalUsers: 1, proUsers: 1, freeUsers: 0 }]
  );
});

test('a single-group report filters the quarter in memory, without a composite index', async () => {
  seedUser('member-free', new Date(2026, 6, 5), { group: 'nhma-members' });
  seedUser('member-pro', new Date(2026, 7, 5), { group: 'nhma-members', isPro: true, isProType: 'monthly' });
  seedUser('member-too-early', new Date(2026, 2, 5), { group: 'nhma-members' });
  seedUser('someone-else', new Date(2026, 7, 6), { group: 'ut-tyler' });

  const groupReport = await generateGroupQuarterlyReport('nhma-members', Q3_2026.year, Q3_2026.quarter);

  assert.equal(groupReport.groupName, 'nhma-members');
  assert.deepEqual(groupReport.users.map(user => user.uid).sort(), ['member-free', 'member-pro']);
  assert.equal(groupReport.totalUsers, 2);
  assert.equal(groupReport.proUsers, 1);
  assert.equal(groupReport.freeUsers, 1);
  assert.ok(queries.every(clauses => clauses.every(clause => clause.field === 'createdAt')));
});

test('the CSV registration date comes from createdAt', async () => {
  const createdAt = new Date(2026, 7, 15, 9, 30);
  seedUser('csv-grouped', createdAt, { group: 'emprx-subscribers' });
  seedUser('csv-ungrouped', new Date(2026, 8, 2, 16, 45));

  const report = await generateQuarterlyReport(Q3_2026.year, Q3_2026.quarter);
  const csv = exportReportToCSV(report);
  const rows = csv.trim().split('\n');

  assert.equal(rows[0].split(',')[8], 'Registration Date');
  const grouped = rows.find(row => row.includes('"csv-grouped"'));
  const ungrouped = rows.find(row => row.includes('"csv-ungrouped"'));
  assert.ok(grouped.startsWith('"emprx-subscribers"'));
  assert.equal(grouped.split(',')[8], `"${createdAt.toISOString()}"`);
  assert.equal(ungrouped.split(',')[8], `"${new Date(2026, 8, 2, 16, 45).toISOString()}"`);
});

test('the route accepts next year and the default quarter after 2030', async (t) => {
  const thisYear = new Date().getFullYear();

  assert.equal((await GET(reportRequest(`?year=${thisYear + 1}&quarter=1`))).status, 200);
  assert.equal((await GET(reportRequest(`?year=${thisYear + 2}&quarter=1`))).status, 400);
  assert.equal((await GET(reportRequest('?year=2019&quarter=1'))).status, 400);

  seedUser('in-2031', new Date(2031, 1, 10), { group: 'cu-anschutz-skaggs' });
  mock.timers.enable({ apis: ['Date'], now: new Date(2031, 1, 15, 12) });
  t.after(() => mock.timers.reset());

  const response = await GET(reportRequest());
  assert.equal(response.status, 200);
  const { report } = await response.json();
  assert.equal(report.year, 2031);
  assert.equal(report.quarter, 'Q1');
  assert.equal(report.totalUsers, 1);
});

test('the single-group CSV download carries the createdAt registration date', async () => {
  const createdAt = new Date(2026, 6, 20, 8);
  seedUser('uconn-member', createdAt, { group: 'uconn-apha-asp' });
  seedUser('not-uconn', new Date(2026, 6, 21, 8));

  const response = await GET(reportRequest('?year=2026&quarter=3&group=uconn-apha-asp&format=csv'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/csv');

  const rows = (await response.text()).trim().split('\n');
  assert.equal(rows.length, 2);
  assert.ok(rows[1].startsWith('"uconn-apha-asp","uconn-member"'));
  assert.ok(rows[1].includes(`"${createdAt.toISOString()}"`));
});
