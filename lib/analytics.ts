/**
 * Event names, in one place.
 *
 * They map onto the HEART framework in Assets/metrics-framework.csv, so the
 * spreadsheet and the dashboard describe the same things. Adding an event here
 * without adding a row there leaves a number nobody knows how to read.
 */
export const EVENTS = {
  // Adoption
  SIGN_IN_STARTED: "sign_in_started",
  SIGN_IN_COMPLETED: "sign_in_completed",
  PWA_INSTALLED: "pwa_installed",
  NOTIFICATIONS_ENABLED: "notifications_enabled",
  PROFILE_EDITED: "profile_edited",
  PROFILE_PHOTO_UPLOADED: "profile_photo_uploaded",

  // Engagement
  FEED_VIEWED: "feed_viewed",
  POST_CREATED: "post_created",
  SESSION_STARRED: "session_starred",
  SESSION_UNSTARRED: "session_unstarred",
  MY_SCHEDULE_VIEWED: "my_schedule_viewed",

  // Task success
  PROGRAM_VIEWED: "program_viewed",
  SESSION_VIEWED: "session_viewed",
  DIRECTORY_SEARCHED: "directory_searched",
  PROFILE_VIEWED: "profile_viewed",
  LINKEDIN_OPENED: "linkedin_opened",
  SLIDES_DOWNLOADED: "slides_downloaded",
  SCAN_STARTED: "scan_started",
  SCAN_PUBLISHED: "scan_published",
  SCAN_DISCARDED: "scan_discarded",
  SCAN_CORRECTION_APPLIED: "scan_correction_applied",

  // Happiness
  APP_RATED: "app_rated",
  SESSION_RATED: "session_rated",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
