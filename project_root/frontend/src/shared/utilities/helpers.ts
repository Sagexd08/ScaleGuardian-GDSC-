/**
 * Formats a date object or string into a more readable format.
 * @param date - The date to format (Date object, string, or timestamp number)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string, or 'Invalid Date'
 */
export const formatDate = (
  date: Date | string | number | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a number into a currency string.
 * @param amount - The number to format
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string => {
  if (amount === undefined || amount === null) return '';
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };
  return new Intl.NumberFormat('en-US', defaultOptions).format(amount);
};

/**
 * Truncates a string to a specified length and adds ellipsis.
 * @param str - The string to truncate
 * @param maxLength - The maximum length before truncating
 * @returns Truncated string with ellipsis, or original string
 */
export const truncateString = (str: string | undefined | null, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + '...';
};

/**
 * Simple utility to join class names, filtering out falsy values.
 * Useful if not using a library like clsx or class-variance-authority.
 * @param classes - Array of class names (strings, undefined, null, boolean)
 * @returns A single string of valid class names
 */
export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
    return classes.filter(Boolean).join(' ');
}