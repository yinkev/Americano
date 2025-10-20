/**
 * Friendly, actionable error messages for Americano
 *
 * Each error provides:
 * - User-friendly title
 * - Helpful description
 * - Actionable next steps
 */

export type ErrorAction = {
  label: string;
  action: () => void;
};

export type FriendlyError = {
  title: string;
  description: string;
  actions?: ErrorAction[];
};

export const ERROR_MESSAGES: Record<string, FriendlyError> = {
  // Network errors
  NETWORK_ERROR: {
    title: "Connection Lost",
    description: "We're having trouble connecting to the server. Don't worry, we'll retry automatically.",
    actions: [
      {
        label: "Retry Now",
        action: () => window.location.reload(),
      },
    ],
  },

  TIMEOUT_ERROR: {
    title: "Request Timed Out",
    description: "The request took longer than expected. This might be due to a slow connection or server load.",
    actions: [
      {
        label: "Try Again",
        action: () => window.location.reload(),
      },
    ],
  },

  // API errors
  API_ERROR: {
    title: "Couldn't Load Your Data",
    description: "We're having trouble loading your information. Try refreshing the page.",
    actions: [
      {
        label: "Refresh Page",
        action: () => window.location.reload(),
      },
    ],
  },

  SERVER_ERROR: {
    title: "Something Went Wrong",
    description: "Our servers are experiencing issues. Our team has been notified and is working on it.",
    actions: [
      {
        label: "Try Again",
        action: () => window.location.reload(),
      },
    ],
  },

  // Authentication errors
  UNAUTHORIZED: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again to continue.",
    actions: [
      {
        label: "Sign In",
        action: () => (window.location.href = "/api/auth/signin"),
      },
    ],
  },

  FORBIDDEN: {
    title: "Access Denied",
    description: "You don't have permission to access this feature yet. Contact support if you think this is a mistake.",
    actions: [
      {
        label: "Contact Support",
        action: () => (window.location.href = "mailto:support@americano.app"),
      },
    ],
  },

  // Data validation errors
  VALIDATION_ERROR: {
    title: "Invalid Input",
    description: "Please check your input and try again. Make sure all required fields are filled out correctly.",
  },

  MISSING_DATA: {
    title: "Missing Information",
    description: "Some required information is missing. Please complete all fields and try again.",
  },

  // Study session errors
  SESSION_NOT_FOUND: {
    title: "Session Not Found",
    description: "We couldn't find this study session. It may have been deleted or doesn't exist.",
    actions: [
      {
        label: "View All Sessions",
        action: () => (window.location.href = "/study"),
      },
    ],
  },

  SESSION_ALREADY_COMPLETED: {
    title: "Session Already Completed",
    description: "This study session has already been completed. Start a new session to continue learning.",
    actions: [
      {
        label: "Start New Session",
        action: () => (window.location.href = "/study"),
      },
    ],
  },

  // Mission errors
  MISSION_GENERATION_FAILED: {
    title: "Couldn't Generate Mission",
    description: "We're having trouble creating your daily mission. This might be due to insufficient data or a temporary issue.",
    actions: [
      {
        label: "Try Again",
        action: () => window.location.reload(),
      },
      {
        label: "Use Manual Mode",
        action: () => (window.location.href = "/study"),
      },
    ],
  },

  NO_OBJECTIVES_AVAILABLE: {
    title: "No Learning Objectives",
    description: "Upload some lecture materials first so we can create personalized learning objectives for you.",
    actions: [
      {
        label: "Upload Lectures",
        action: () => (window.location.href = "/library/upload"),
      },
    ],
  },

  // Analytics errors
  INSUFFICIENT_DATA: {
    title: "Not Enough Data Yet",
    description: "We need more study sessions to generate meaningful insights. Keep learning, and check back soon!",
    actions: [
      {
        label: "Start Studying",
        action: () => (window.location.href = "/study"),
      },
    ],
  },

  PREDICTION_FAILED: {
    title: "Prediction Unavailable",
    description: "Our AI models couldn't generate predictions right now. This feature will be available after a few more study sessions.",
    actions: [
      {
        label: "Continue Learning",
        action: () => (window.location.href = "/study"),
      },
    ],
  },

  // File upload errors
  FILE_TOO_LARGE: {
    title: "File Too Large",
    description: "The file you're trying to upload is too large. Please use a file smaller than 10MB.",
  },

  UNSUPPORTED_FILE_TYPE: {
    title: "Unsupported File Type",
    description: "We currently only support PDF files. Please convert your file to PDF and try again.",
  },

  UPLOAD_FAILED: {
    title: "Upload Failed",
    description: "We couldn't upload your file. Please check your connection and try again.",
    actions: [
      {
        label: "Try Again",
        action: () => window.location.reload(),
      },
    ],
  },

  // Calendar integration errors
  CALENDAR_CONNECTION_FAILED: {
    title: "Calendar Connection Failed",
    description: "We couldn't connect to your calendar. Please check your permissions and try again.",
    actions: [
      {
        label: "Retry Connection",
        action: () => (window.location.href = "/settings"),
      },
    ],
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: "Unexpected Error",
    description: "Something unexpected happened. Try refreshing the page, or contact support if the problem persists.",
    actions: [
      {
        label: "Refresh Page",
        action: () => window.location.reload(),
      },
      {
        label: "Contact Support",
        action: () => (window.location.href = "mailto:support@americano.app"),
      },
    ],
  },
};

/**
 * Get a friendly error message based on error type or HTTP status code
 */
export function getFriendlyError(
  errorType?: string,
  statusCode?: number
): FriendlyError {
  // Try to match by error type first
  if (errorType && ERROR_MESSAGES[errorType]) {
    return ERROR_MESSAGES[errorType];
  }

  // Fall back to status code matching
  if (statusCode) {
    switch (statusCode) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.SESSION_NOT_FOUND;
      case 408:
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      case 413:
        return ERROR_MESSAGES.FILE_TOO_LARGE;
      case 422:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  // Ultimate fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Helper to show a friendly error toast
 */
export function showFriendlyError(
  toast: (options: { title: string; description: string; variant?: string }) => void,
  errorType?: string,
  statusCode?: number
) {
  const error = getFriendlyError(errorType, statusCode);
  toast({
    title: error.title,
    description: error.description,
    variant: "destructive",
  });
}
