// CSV parsing utilities using PapaParse

import Papa from 'papaparse';

/**
 * Parse CSV file for conference guests
 * Expected columns: name, email, group, dietaryPreference, notes
 */
export function parseGuestCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
          return;
        }

        const timestamp = Date.now();

        const guests = results.data
          .map((rawRow, index) => {
            if (!rawRow || typeof rawRow !== 'object') return null;

            const normalizedRow = {};
            const lowerCaseRow = {};

            Object.entries(rawRow).forEach(([rawKey, rawValue]) => {
              if (typeof rawKey !== 'string') return;
              const key = rawKey.replace(/\uFEFF/g, '').trim();
              const value =
                typeof rawValue === 'string' ? rawValue.trim() : rawValue ?? '';

              if (!key) return;
              normalizedRow[key] = value;
              lowerCaseRow[key.toLowerCase()] = value;
            });

            const getField = (...keys) => {
              for (const key of keys) {
                if (key in normalizedRow && normalizedRow[key] !== '') {
                  return normalizedRow[key];
                }
                const lowerKey = key.toLowerCase();
                if (lowerKey in lowerCaseRow && lowerCaseRow[lowerKey] !== '') {
                  return lowerCaseRow[lowerKey];
                }
              }
              return '';
            };

            const parseAttendance = (value) => {
              if (value === '' || value === null || value === undefined) {
                return true;
              }
              const normalized =
                typeof value === 'string'
                  ? value.trim().toLowerCase()
                  : String(value).toLowerCase();

              if (['false', '0', '否', 'no', 'n'].includes(normalized)) {
                return false;
              }
              if (['true', '1', '是', 'yes', 'y'].includes(normalized)) {
                return true;
              }
              return true;
            };

            const formatString = (value) => {
              if (value === null || value === undefined) return '';
              return typeof value === 'string' ? value.trim() : String(value).trim();
            };

            const name = formatString(getField('name', '姓名', 'Name'));
            const email = formatString(getField('email', '邮箱', 'Email'));
            const group = formatString(getField('group', '分组', 'Group'));
            const dietaryPreference = formatString(getField('dietaryPreference', '饮食偏好', 'Dietary Preference'));
            const notes = formatString(getField('notes', '备注', 'Notes'));
            const attendanceValue = getField('attendance', '参加', 'Attendance');

            if (!name && !email) {
              return null;
            }

            return {
              id: `guest-${timestamp}-${index}-${Math.random().toString(36).slice(2, 8)}`,
              name,
              email,
              group: group || 'General',
              dietaryPreference: dietaryPreference || 'None',
              attendance: parseAttendance(attendanceValue),
              notes,
              tableNumber: null,
              seatNumber: null,
              checkedIn: false, // Default check-in status for imported guests
            };
          })
          .filter(Boolean);

        resolve(guests);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Parse CSV file for tradeshow vendors
 * Expected columns: name, contactName, email, phone, category, notes
 */
export function parseVendorCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
          return;
        }

        const vendors = results.data
          .map((row, index) => ({
            id: Date.now() + index,
            name: row.name || row['公司名称'] || row['Company Name'] || '',
            contactName: row.contactName || row['联系人'] || row['Contact Person'] || '',
            email: row.email || row['邮箱'] || row['Email'] || '',
            phone: row.phone || row['电话'] || row['Phone'] || '',
            category: row.category || row['类别'] || row['Category'] || 'Other',
            notes: row.notes || row['备注'] || row['Notes'] || '',
            boothNumber: null,
          }))
          .filter(vendor => vendor.name.trim() !== ''); // Filter out vendors without names

        resolve(vendors);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Convert guests array to CSV string
 */
export function guestsToCSV(guests) {
  const headers = ['Name', 'Email', 'Group', 'Dietary Preference', 'Attendance', 'Table Number', 'Seat Number', 'Notes'];
  const data = guests.map(g => [
    g.name,
    g.email,
    g.group,
    g.dietaryPreference,
    g.attendance ? 'Yes' : 'No',
    g.tableNumber || '',
    g.seatNumber || '',
    g.notes,
  ]);

  return Papa.unparse({
    fields: headers,
    data: data,
  });
}

/**
 * Convert filtered guests array to CSV string
 */
export function guestsToCSVFiltered(guests, dietaryPreference) {
  const filtered = guests.filter(g => g.dietaryPreference === dietaryPreference);
  const headers = ['Name', 'Email', 'Group', 'Dietary Preference', 'Attendance', 'Table Number', 'Seat Number', 'Notes'];
  const data = filtered.map(g => [
    g.name,
    g.email,
    g.group,
    g.dietaryPreference,
    g.attendance ? 'Yes' : 'No',
    g.tableNumber || '',
    g.seatNumber || '',
    g.notes,
  ]);

  return Papa.unparse({
    fields: headers,
    data: data,
  });
}

/**
 * Export guests by group with Excel highlighting
 * Creates an Excel file with groups highlighted in gray
 */
export function exportGuestsByGroup(guests) {
  // Sort guests by group
  const sortedGuests = [...guests].sort((a, b) => {
    if ((a.group || '') < (b.group || '')) return -1;
    if ((a.group || '') > (b.group || '')) return 1;
    return 0;
  });

  // Group guests
  const groupedGuests = {};
  sortedGuests.forEach(guest => {
    const group = guest.group || 'No Group';
    if (!groupedGuests[group]) {
      groupedGuests[group] = [];
    }
    groupedGuests[group].push(guest);
  });

  // Create Excel-compatible HTML
  let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Guests by Group</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        .group-row { background-color: #D9D9D9; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Group</th>
            <th>Dietary Preference</th>
            <th>Attendance</th>
            <th>Table Number</th>
            <th>Seat Number</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.keys(groupedGuests).forEach(group => {
    // Add group header row
    htmlContent += `
      <tr class="group-row">
        <td colspan="8">${group}</td>
      </tr>
    `;

    // Add guest rows
    groupedGuests[group].forEach(guest => {
      htmlContent += `
        <tr>
          <td>${guest.name || ''}</td>
          <td>${guest.email || ''}</td>
          <td>${guest.group || ''}</td>
          <td>${guest.dietaryPreference || 'None'}</td>
          <td>${guest.attendance ? 'Yes' : 'No'}</td>
          <td>${guest.tableNumber || ''}</td>
          <td>${guest.seatNumber || ''}</td>
          <td>${guest.notes || ''}</td>
        </tr>
      `;
    });
  });

  htmlContent += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create and download file
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `guests-by-group-${Date.now()}.xls`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert vendors array to CSV string
 */
export function vendorsToCSV(vendors) {
  const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'Category', 'Booth Number', 'Notes'];
  const data = vendors.map(v => [
    v.name,
    v.contactName,
    v.email,
    v.phone,
    v.category,
    v.boothNumber || '',
    v.notes,
  ]);

  return Papa.unparse({
    fields: headers,
    data: data,
  });
}

/**
 * Download CSV file
 */
export function downloadCSV(csvString, filename) {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get CSV template for guests
 */
export function getGuestCSVTemplate() {
  const headers = ['name', 'email', 'group', 'dietaryPreference', 'notes'];
  const sampleData = [
    ['John Doe', 'john@example.com', 'VIP', 'Vegetarian', 'Allergy: Peanuts'],
    ['Jane Smith', 'jane@example.com', 'General', 'None', ''],
    ['Bob Wilson', 'bob@example.com', 'Staff', 'Halal', 'Arriving late'],
  ];

  return Papa.unparse({
    fields: headers,
    data: sampleData,
  });
}

/**
 * Get CSV template for vendors
 */
export function getVendorCSVTemplate() {
  const headers = ['name', 'contactName', 'email', 'phone', 'category', 'notes'];
  const sampleData = [
    ['Tech Company A', 'Mr. Zhang', 'contact@companya.com', '010-12345678', 'Technology', ''],
    ['Green Energy B', 'Ms. Li', 'info@companyb.com', '021-87654321', 'Energy', 'Needs island booth'],
    ['Innovation Lab C', 'Dr. Wang', 'lab@companyc.com', '0755-11112222', 'Research', ''],
  ];

  return Papa.unparse({
    fields: headers,
    data: sampleData,
  });
}
