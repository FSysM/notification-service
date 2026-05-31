export const NotificationEvent = {
  // Submissions
  SUBMISSION_APPROVED:          'submission.approved',
  SUBMISSION_REJECTED:          'submission.rejected',
  SUBMISSION_SUBMITTED:         'submission.submitted',
  SUBMISSION_EDITED:            'submission.edited',
  SUBMISSION_DELETED:           'submission.deleted',
  SUBMISSION_OPPONENT_ASSIGNED: 'submission.opponent_assigned',

  // Assignments
  ASSIGNMENT_PICKED:   'assignment.picked',
  ASSIGNMENT_UNPICKED: 'assignment.unpicked',

  // Reviews
  REVIEW_CREATED: 'review.created',
  REVIEW_EDITED:  'review.edited',
  REVIEW_DELETED: 'review.deleted',

  // Files — main (TEXT folder)
  FILE_MAIN_UPLOADED: 'file.main_uploaded',
  FILE_MAIN_EDITED:   'file.main_edited',
  FILE_MAIN_DELETED:  'file.main_deleted',

  // Files — attachments (FILES folder)
  FILE_ATTACHMENT_UPLOADED: 'file.attachment_uploaded',
  FILE_ATTACHMENT_EDITED:   'file.attachment_edited',
  FILE_ATTACHMENT_DELETED:  'file.attachment_deleted',

  // Files — review documents (REVIEWS folder)
  FILE_UPLOADED: 'file.uploaded',
  FILE_EDITED:   'file.edited',
  FILE_DELETED:  'file.deleted',
} as const;

export type NotificationEventValue = typeof NotificationEvent[keyof typeof NotificationEvent];

// ── Shared base ──────────────────────────────────────────────────────────────

type BasePayload = {
  recipientIds: string[];
  actorName: string;
  entityId: string;
};

// ── Per-domain payloads ──────────────────────────────────────────────────────

export type SubmissionPayload = BasePayload & {
  entityType: 'submission';
  submissionTopic: string;
};

export type AssignmentPayload = BasePayload & {
  entityType: 'assignment';
  assignmentTopic: string;
};

export type ReviewPayload = BasePayload & {
  entityType: 'review';
  reviewType: 'SUPERVISOR' | 'OPPONENT';
  submissionTopic: string;
};

export type FilePayload = BasePayload & {
  entityType: 'file';
  filename: string;
  submissionTopic: string;
};

export type NotificationPayload =
  | SubmissionPayload
  | AssignmentPayload
  | ReviewPayload
  | FilePayload;
