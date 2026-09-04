/**
 * Event names, in one place.
 *
 * They map onto the HEART framework in Assets/metrics-framework.csv and the
 * PostHog spec. The spreadsheet and the dashboard describe the same things.
 * Adding an event here without adding a row there leaves a number nobody
 * knows how to read.
 */
export const EVENTS = {
  // Adoption
  SIGN_IN_EMAIL_REQUESTED: "sign_in_email_requested",
  SIGN_IN_STARTED: "sign_in_started",
  SIGN_IN_COMPLETED: "sign_in_completed",
  HOME_SCREEN_LAUNCH: "home_screen_launch",
  NOTIFICATION_PERMISSION_GRANTED: "notification_permission_granted",
  PROFILE_EDITED: "profile_edited",

  // Engagement
  FEED_OPENED: "feed_opened",
  ATTENDEE_POST_CREATED: "attendee_post_created",
  SESSION_STARRED: "session_starred",
  MY_SCHEDULE_VIEWED: "my_schedule_viewed",

  // Task success
  PROGRAM_OPENED: "program_opened",
  SESSION_PAGE_OPENED: "session_page_opened",
  DIRECTORY_SEARCH: "directory_search",
  PROFILE_VIEW: "profile_view",
  LINKEDIN_TAP: "linkedin_tap",
  SLIDES_DOWNLOAD_TAPPED: "slides_download_tapped",
  SCAN_STARTED: "scan_started",
  SCAN_PUBLISHED: "scan_published",

  // Notifications
  NOTIFICATION_RECEIVED: "notification_received",
  NOTIFICATION_OPENED: "notification_opened",

  // Slides
  SLIDES_ANNOUNCEMENT_POSTED: "slides_announcement_posted",

  // Session
  SESSION_START: "session_start",

  // Happiness
  APP_RATING_SUBMITTED: "app_rating_submitted",
  SESSION_RATING_SUBMITTED: "session_rating_submitted",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
