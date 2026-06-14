/**
 * Formats a number to British Pound (GBP) currency format.
 * Example: 1234.56 -> £1,234.56
 */
export const formatGBP = (value) => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (number === null || number === undefined || isNaN(number)) {
    return '£0.00';
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(number);
};

/**
 * Formats a date string or object to UK date format (DD/MM/YYYY).
 * Example: '2026-06-14' -> '14/06/2026'
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formats a SQL time string to standard HH:MM representation.
 * Example: '09:30:00' -> '09:30'
 */
export const formatTime = (timeInput) => {
  if (!timeInput) return '';
  // Handles '09:30:00' -> '09:30'
  return timeInput.substring(0, 5);
};
