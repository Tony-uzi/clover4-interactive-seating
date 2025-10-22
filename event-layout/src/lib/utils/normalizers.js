// Shared normalization helpers to keep client state consistent across planner and kiosk views

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toStringOrNull = (value) => {
  if (value === undefined || value === null) return null;
  return String(value);
};

export function isUuid(value) {
  if (typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
}

export function normalizeConferenceGuest(raw) {
  if (!raw) return null;

  const seatInfo = raw.seat_info || raw.seatInfo || null;
  const id = raw.id || raw.guestId || raw.guest_id || null;

  const seatAssignmentId =
    raw.seatAssignmentId ||
    raw.seat_assignment_id ||
    seatInfo?.assignment_id ||
    raw.assignmentId ||
    raw.assignment_id ||
    null;

  const elementId =
    raw.elementId ||
    raw.element_id ||
    seatInfo?.element_id ||
    raw.elementId ||
    raw.element ||
    null;

  const tableNumber =
    raw.tableNumber ??
    raw.table_number ??
    seatInfo?.element_label ??
    raw.elementLabel ??
    null;

  const seatNumber =
    raw.seatNumber ??
    raw.seat_number ??
    seatInfo?.seat_number ??
    null;

  return {
    id: id ? String(id) : null,
    name: raw.name || '',
    email: raw.email || '',
    company: raw.company || raw.company_name || '',
    phone: raw.phone || raw.contact_phone || '',
    group: raw.group_name || raw.group || '',
    dietaryPreference:
      raw.dietaryPreference ||
      raw.dietary_preference ||
      raw.dietary_requirements ||
      '',
    notes: raw.notes || '',
    attendance:
      raw.attendance !== undefined
        ? Boolean(raw.attendance)
        : true,
    checkedIn:
      raw.checkedIn !== undefined
        ? Boolean(raw.checkedIn)
        : Boolean(raw.checked_in),
    checkInTime: raw.checkInTime || raw.check_in_time || null,
    seatAssignmentId: seatAssignmentId ? String(seatAssignmentId) : null,
    elementId: elementId ? String(elementId) : null,
    tableNumber: tableNumber ? String(tableNumber) : null,
    seatNumber: seatNumber !== undefined && seatNumber !== null ? seatNumber : null,
  };
}

export function normalizeTradeshowVendor(raw) {
  if (!raw) return null;

  const boothInfo = raw.booth_info || raw.boothInfo || null;
  const id = raw.id || raw.vendorId || raw.vendor_id || null;
  const boothAssignmentId =
    raw.boothAssignmentId ||
    raw.booth_assignment_id ||
    boothInfo?.assignment_id ||
    raw.assignmentId ||
    null;

  const boothId =
    raw.boothId ||
    raw.booth_id ||
    boothInfo?.booth_id ||
    null;

  const boothLabel =
    raw.boothNumber ??
    raw.booth_number ??
    boothInfo?.booth_label ??
    raw.boothLabel ??
    null;

  const companyName = raw.companyName || raw.company_name || raw.name || '';
  const contactName = raw.contactName || raw.contact_name || '';
  const contactEmail = raw.contactEmail || raw.contact_email || raw.email || '';
  const contactPhone = raw.contactPhone || raw.contact_phone || raw.phone || '';

  return {
    id: id ? String(id) : null,
    companyName,
    name: companyName,
    contactName,
    contactEmail,
    email: contactEmail,
    contactPhone,
    phone: contactPhone,
    category: raw.category || '',
    boothPreference: raw.boothPreference || raw.booth_preference || raw.booth_size_preference || '',
    website: raw.website || '',
    logoUrl: raw.logoUrl || raw.logo_url || '',
    description: raw.description || '',
    notes: raw.notes || raw.description || '',
    boothAssignmentId: boothAssignmentId ? String(boothAssignmentId) : null,
    boothId: boothId ? String(boothId) : null,
    boothNumber: boothLabel ? String(boothLabel) : null,
    checkedIn:
      raw.checkedIn !== undefined
        ? Boolean(raw.checkedIn)
        : Boolean(raw.checked_in),
  };
}

export function normalizeConferenceElement(raw) {
  if (!raw) return null;
  const resolvedId =
    raw.id ??
    raw.element_id ??
    raw.elementId ??
    raw.tempId ??
    raw.uuid ??
    null;
  if (!resolvedId) return null;
  
  // Validate element type - only accept known conference element types
  const elementType = raw.type || raw.element_type;
  const validTypes = ['table_round', 'table_rectangle', 'table_rect', 'table_square', 'chair', 'podium', 'door', 'outlet'];
  if (!elementType || !validTypes.includes(elementType)) {
    console.warn('Invalid element type, skipping:', elementType, raw);
    return null;
  }
  
  return {
    id: String(resolvedId),
    type: elementType,
    label: raw.label || raw.element_label || '',
    x: raw.x ?? raw.position_x ?? 0,
    y: raw.y ?? raw.position_y ?? 0,
    width: raw.width ?? 1,
    height: raw.height ?? 1,
    rotation: raw.rotation || 0,
    seats: raw.seats ?? 0,
  };
}

export function normalizeTradeshowBooth(raw) {
  if (!raw) return null;
  const resolvedId =
    raw.id ??
    raw.booth_id ??
    raw.boothId ??
    raw.tempId ??
    raw.uuid ??
    null;
  if (!resolvedId) return null;
  
  // Validate booth type - accept both booth and facility types
  const boothType = raw.type || raw.booth_type;
  const validTypes = [
    'booth_standard', 'booth_large', 'booth_premium', 'booth_island',
    'aisle', 'tactile_paving', 'waiting_area', 'restroom', 'info_desk'
  ];
  if (!boothType || !validTypes.includes(boothType)) {
    console.warn('Invalid booth type, skipping:', boothType, raw);
    return null;
  }
  
  return {
    id: String(resolvedId),
    type: boothType,
    label: raw.label || raw.booth_label || '',
    x: raw.x ?? raw.position_x ?? 0,
    y: raw.y ?? raw.position_y ?? 0,
    width: raw.width ?? 1,
    height: raw.height ?? 1,
    rotation: raw.rotation || 0,
  };
}
