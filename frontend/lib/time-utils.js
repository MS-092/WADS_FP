/**
 * Timezone-aware time formatting utilities
 * Handles UTC timestamps from backend and converts them to user's local timezone
 */

/**
 * Format a UTC timestamp to show relative time in user's local timezone
 * @param {string} utcDateString - UTC timestamp string from backend
 * @returns {string} Formatted relative time string
 */
export const formatTimeAgo = (utcDateString) => {
  if (!utcDateString) return 'Just now'
  
  try {
    // Parse the UTC timestamp
    let utcDate
    
    // Check if the dateString has timezone info (ends with 'Z' or has '+'/'-' offset)
    const hasTimezone = utcDateString.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(utcDateString)
    
    if (hasTimezone) {
      // Already timezone-aware, use as is
      utcDate = new Date(utcDateString)
    } else {
      // Naive datetime, treat as UTC by appending 'Z'
      utcDate = new Date(utcDateString + 'Z')
    }
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      console.warn('Invalid date string:', utcDateString)
      return 'Unknown time'
    }
    
    // Get current time in user's local timezone
    const now = new Date()
    
    // Calculate difference in milliseconds
    const diffInMs = now.getTime() - utcDate.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    
    // Handle edge cases
    if (diffInMinutes < 0) {
      // Future time - could happen due to small clock differences
      return 'Just now'
    }
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes === 1) return '1 minute ago'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks === 1) return '1 week ago'
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    
    // For older dates, show the actual date in user's local timezone
    return utcDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
  } catch (error) {
    console.error('Error formatting time:', error, 'Input:', utcDateString)
    return 'Unknown time'
  }
}

/**
 * Format a UTC timestamp to show full date and time in user's local timezone
 * @param {string} utcDateString - UTC timestamp string from backend
 * @returns {string} Formatted date and time string
 */
export const formatFullDateTime = (utcDateString) => {
  if (!utcDateString) return 'Unknown time'
  
  try {
    let utcDate
    
    const hasTimezone = utcDateString.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(utcDateString)
    
    if (hasTimezone) {
      utcDate = new Date(utcDateString)
    } else {
      utcDate = new Date(utcDateString + 'Z')
    }
    
    if (isNaN(utcDate.getTime())) {
      console.warn('Invalid date string:', utcDateString)
      return 'Unknown time'
    }
    
    // Format to user's local timezone
    return utcDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
  } catch (error) {
    console.error('Error formatting full date time:', error, 'Input:', utcDateString)
    return 'Unknown time'
  }
}

/**
 * Format a UTC timestamp to show just the date in user's local timezone
 * @param {string} utcDateString - UTC timestamp string from backend
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (utcDateString) => {
  if (!utcDateString) return 'Unknown date'
  
  try {
    let utcDate
    
    const hasTimezone = utcDateString.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(utcDateString)
    
    if (hasTimezone) {
      utcDate = new Date(utcDateString)
    } else {
      utcDate = new Date(utcDateString + 'Z')
    }
    
    if (isNaN(utcDate.getTime())) {
      console.warn('Invalid date string:', utcDateString)
      return 'Unknown date'
    }
    
    return utcDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
  } catch (error) {
    console.error('Error formatting date only:', error, 'Input:', utcDateString)
    return 'Unknown date'
  }
}

/**
 * Format a UTC timestamp to show just the time in user's local timezone
 * @param {string} utcDateString - UTC timestamp string from backend
 * @returns {string} Formatted time string (HH:MM format)
 */
export const formatTimeOnly = (utcDateString) => {
  if (!utcDateString) return 'Unknown time'
  
  try {
    let utcDate
    
    const hasTimezone = utcDateString.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(utcDateString)
    
    if (hasTimezone) {
      utcDate = new Date(utcDateString)
    } else {
      utcDate = new Date(utcDateString + 'Z')
    }
    
    if (isNaN(utcDate.getTime())) {
      console.warn('Invalid date string:', utcDateString)
      return 'Unknown time'
    }
    
    return utcDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
  } catch (error) {
    console.error('Error formatting time only:', error, 'Input:', utcDateString)
    return 'Unknown time'
  }
}

/**
 * Get user's detected timezone
 * @returns {string} User's timezone identifier (e.g., "America/New_York")
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Error getting user timezone:', error)
    return 'UTC'
  }
}

/**
 * Convert UTC timestamp to user's local Date object
 * @param {string} utcDateString - UTC timestamp string from backend
 * @returns {Date|null} Date object in user's local timezone or null if invalid
 */
export const parseUtcToLocal = (utcDateString) => {
  if (!utcDateString) return null
  
  try {
    let utcDate
    
    const hasTimezone = utcDateString.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(utcDateString)
    
    if (hasTimezone) {
      utcDate = new Date(utcDateString)
    } else {
      utcDate = new Date(utcDateString + 'Z')
    }
    
    if (isNaN(utcDate.getTime())) {
      console.warn('Invalid date string:', utcDateString)
      return null
    }
    
    return utcDate
    
  } catch (error) {
    console.error('Error parsing UTC to local:', error, 'Input:', utcDateString)
    return null
  }
} 