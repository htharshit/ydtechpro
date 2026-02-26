
/**
 * YDTechPro Cloud Sync Backend v7.2
 * Robust Google Sheets API for technical service management.
 */

const DB_CONFIG = {
  AuditLogs: ['Timestamp', 'User ID', 'Name', 'Roles', 'Action', 'Details'],
  Orders: ['Order ID', 'Status', 'Service Name', 'Buyer ID', 'Buyer Name', 'Provider ID', 'Provider Name', 'Final Price', 'Base Budget', 'Phone', 'Address', 'City', 'Product Items', 'Created At', 'Provider Company', 'Service Fee', 'Requirements', 'Messages', 'Quotes'],
  Users: ['User ID', 'First Name', 'Last Name', 'Full Name', 'Email', 'Phone', 'Roles', 'Company', 'GST Num', 'Joined Date', 'Approved', 'Address', 'Lead Limit', 'Status', 'Photo URL'],
  Services: ['Service ID', 'Name', 'Role', 'Unit', 'Price', 'Description', 'Category'],
  Inventory: ['Product ID', 'Name', 'Brand', 'Category', 'Price (₹)', 'Stock', 'Description', 'Specs', 'Image URL', 'Vendor ID', 'Vendor Name'],
  SystemReports: ['Report ID', 'User Name', 'Type', 'Description', 'Timestamp', 'Status']
};

/**
 * Handle Pull Requests (GET)
 */
function doGet(e) {
  const action = (e && e.parameter) ? e.parameter.action : null;
  
  try {
    if (action === 'health') {
      return sendJson({ status: 'success', message: 'YDTechPro Cloud Link is Active', timestamp: new Date().toISOString() });
    }

    if (action === 'fetchAll') {
      return sendJson({
        status: 'success',
        users: getSheetData('Users', mapUserFromRow),
        products: getSheetData('Inventory', mapProductFromRow),
        services: getSheetData('Services', mapServiceFromRow),
        orders: getSheetData('Orders', mapOrderFromRow),
        logs: getSheetData('AuditLogs', mapLogFromRow),
        reports: getSheetData('SystemReports', mapReportFromRow)
      });
    }
    
    return sendJson({ status: 'error', message: 'Unknown GET action: ' + action });
  } catch (err) {
    return sendJson({ status: 'error', message: 'GET Error: ' + err.toString() });
  }
}

/**
 * Handle Push Requests (POST)
 */
function doPost(e) {
  let response = { status: 'error', message: 'No action performed' };
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return sendJson({ status: 'error', message: 'Missing Payload' });
    }

    const data = JSON.parse(e.postData.contents);
    const { action } = data;

    if (action === 'log') {
      const sheet = getSheet('AuditLogs');
      const r = data.record;
      sheet.appendRow([new Date(), r.userId, r.userName, (r.userRoles || []).join(', '), r.action, r.details]);
      response = { status: 'success' };
    } 
    else if (action === 'saveReport') {
      upsert(getSheet('SystemReports'), data.report.id, mapReportToRow(data.report));
      response = { status: 'success' };
    }
    else if (action === 'saveProduct') {
      upsert(getSheet('Inventory'), data.product.id, mapProductToRow(data.product));
      response = { status: 'success' };
    }
    else if (action === 'deleteProduct') {
      removeRow(getSheet('Inventory'), data.productId);
      response = { status: 'success' };
    }
    else if (action === 'saveUser') {
      upsert(getSheet('Users'), data.user.id, mapUserToRow(data.user));
      response = { status: 'success' };
    }
    else if (action === 'deleteUser') {
      removeRow(getSheet('Users'), data.userId);
      response = { status: 'success' };
    }
    else if (action === 'saveOrder') {
      upsert(getSheet('Orders'), data.order.id, mapOrderToRow(data.order));
      response = { status: 'success' };
    }
    else if (action === 'saveService') {
      upsert(getSheet('Services'), data.service.id, mapServiceToRow(data.service));
      response = { status: 'success' };
    }
    else if (action === 'deleteService') {
      removeRow(getSheet('Services'), data.serviceId);
      response = { status: 'success' };
    }

    return sendJson(response);
  } catch (err) {
    return sendJson({ status: 'error', message: 'POST Error: ' + err.toString() });
  }
}

/** Data Transformation Mappers */

function mapUserToRow(u) {
  const rolesStr = Array.isArray(u.roles) ? u.roles.join(', ') : (u.roles || '-');
  return [
    u.id, u.firstName || '', u.lastName || '', u.name || '', u.email, u.phone || '', 
    rolesStr, u.companyName || '-', u.hasGst ? u.gstNumber : 'N/A', u.joinedDate, 
    u.isApproved ? 'YES' : 'NO', u.address || '', u.maxActiveLeads || 2, 
    u.status || 'active', u.photoUrl || ''
  ];
}
function mapUserFromRow(row) {
  return { 
    id: String(row[0]), firstName: String(row[1]), lastName: String(row[2]), 
    name: String(row[3]), email: String(row[4]), phone: String(row[5]), 
    roles: String(row[6]).split(', '), companyName: row[7], gstNumber: row[8], 
    joinedDate: row[9], isApproved: row[10] === 'YES', address: row[11], 
    maxActiveLeads: Number(row[12]), status: row[13], photoUrl: row[14] 
  };
}

function mapOrderToRow(o) {
  const pList = o.productItems ? JSON.stringify(o.productItems) : '[]';
  return [
    o.id, o.status, o.serviceName, o.buyerId, o.buyerName, o.providerId || '-', 
    o.providerName || '-', o.finalPrice || 0, o.budget, o.phone, o.address, 
    o.city, pList, o.createdAt, o.providerCompanyName || '-', o.serviceFeeAmount || 0, 
    o.requirements || '', JSON.stringify(o.messages || []), JSON.stringify(o.quotes || [])
  ];
}
function mapOrderFromRow(row) {
  return { 
    id: String(row[0]), status: row[1], serviceName: row[2], buyerId: row[3], 
    buyerName: row[4], providerId: row[5] === '-' ? undefined : row[5], 
    providerName: row[6] === '-' ? undefined : row[6], finalPrice: Number(row[7]), 
    budget: Number(row[8]), phone: row[9], address: row[10], city: row[11], 
    productItems: JSON.parse(row[12] || '[]'), createdAt: row[13], 
    providerCompanyName: row[14], serviceFeeAmount: Number(row[15]), 
    requirements: row[16], messages: JSON.parse(row[17] || '[]'), 
    quotes: JSON.parse(row[18] || '[]') 
  };
}

function mapProductToRow(p) {
  return [p.id, p.name, p.brand, p.category, p.price, p.stock || 0, p.description || '', Array.isArray(p.specs) ? p.specs.join(' | ') : (p.specs || ''), p.image || '', p.vendorId || '', p.vendorName || ''];
}
function mapProductFromRow(row) {
  return { id: String(row[0]), name: String(row[1]), brand: String(row[2]), category: String(row[3]), price: Number(row[4]) || 0, stock: Number(row[5]) || 0, description: String(row[6] || ''), specs: String(row[7] || '').split(' | ').filter(s => s.trim() !== ''), image: String(row[8] || ''), vendorId: String(row[9] || ''), vendorName: String(row[10] || '') };
}

function mapServiceToRow(s) {
  return [s.id, s.name, s.providerRole, s.unit, s.price, s.description, s.category];
}
function mapServiceFromRow(row) {
  return { id: String(row[0]), name: String(row[1]), providerRole: row[2], unit: row[3], price: Number(row[4]), description: row[5], category: row[6] };
}

function mapReportToRow(r) {
  return [r.id, r.userName, r.type, r.description, r.timestamp, r.status];
}
function mapReportFromRow(row) {
  return { id: String(row[0]), userName: row[1], type: row[2], description: row[3], timestamp: row[4], status: row[5] };
}

function getLogToRow(r) { return [r.timestamp, r.userId, r.userName, r.userRoles, r.action, r.details]; }
function mapLogFromRow(row) { return { timestamp: row[0], userId: row[1], userName: row[2], userRoles: String(row[3]).split(', '), action: row[4], details: row[5] }; }

function getSheetData(name, mapper) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(mapper);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    const headers = DB_CONFIG[name];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F4F6');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsert(sheet, id, rowData) {
  const data = sheet.getDataRange().getValues();
  const idStr = String(id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idStr) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

function removeRow(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const idStr = String(id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idStr) { sheet.deleteRow(i + 1); break; }
  }
}

function sendJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
