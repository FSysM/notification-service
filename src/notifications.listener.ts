import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import type {
  SubmissionPayload,
  AssignmentPayload,
  ReviewPayload,
  FilePayload,
} from './notifications.events';

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  private async notify(
    type: any,
    message: string,
    payload: { recipientIds: string[]; entityType: string; entityId: string },
  ) {
    if (!payload.recipientIds.length) return;
    await this.notifications.createMany(
      payload.recipientIds.map((recipientId) => ({
        type,
        message,
        recipientId,
        entityType: payload.entityType,
        entityId: payload.entityId,
      })),
    );
    const createdAt = new Date();
    for (const recipientId of payload.recipientIds) {
      this.gateway.emitToUser(recipientId, {
        type,
        message,
        entityType: payload.entityType,
        entityId: payload.entityId,
        createdAt,
      });
    }
  }

  private reviewLabel(type: 'SUPERVISOR' | 'OPPONENT') {
    return type === 'SUPERVISOR' ? 'Supervisor' : 'Opponent';
  }

  // ── Submissions ────────────────────────────────────────────────────────────

  async onSubmissionApproved(p: SubmissionPayload) {
    await this.notify('SUBMISSION_APPROVED', `Submission "${p.submissionTopic}" was approved by ${p.actorName}`, p);
  }

  async onSubmissionRejected(p: SubmissionPayload) {
    await this.notify('SUBMISSION_REJECTED', `Submission "${p.submissionTopic}" was rejected by ${p.actorName}`, p);
  }

  async onSubmissionSubmitted(p: SubmissionPayload) {
    await this.notify('SUBMISSION_SUBMITTED', `Submission "${p.submissionTopic}" was submitted by ${p.actorName}`, p);
  }

  async onSubmissionEdited(p: SubmissionPayload) {
    await this.notify('SUBMISSION_EDITED', `Submission "${p.submissionTopic}" was edited by ${p.actorName}`, p);
  }

  async onSubmissionDeleted(p: SubmissionPayload) {
    await this.notify('SUBMISSION_DELETED', `Submission "${p.submissionTopic}" was deleted by ${p.actorName}`, p);
  }

  async onSubmissionOpponentAssigned(p: SubmissionPayload) {
    await this.notify('SUBMISSION_OPPONENT_ASSIGNED', `${p.actorName} was assigned as opponent for submission "${p.submissionTopic}"`, p);
  }

  // ── Assignments ────────────────────────────────────────────────────────────

  async onAssignmentPicked(p: AssignmentPayload) {
    await this.notify('ASSIGNMENT_PICKED', `Assignment "${p.assignmentTopic}" was picked by ${p.actorName}`, p);
  }

  async onAssignmentUnpicked(p: AssignmentPayload) {
    await this.notify('ASSIGNMENT_UNPICKED', `Assignment "${p.assignmentTopic}" was unpicked by ${p.actorName}`, p);
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  async onReviewCreated(p: ReviewPayload) {
    await this.notify('REVIEW_CREATED', `${this.reviewLabel(p.reviewType)} review for submission "${p.submissionTopic}" was created by ${p.actorName}`, p);
  }

  async onReviewEdited(p: ReviewPayload) {
    await this.notify('REVIEW_EDITED', `${this.reviewLabel(p.reviewType)} review for submission "${p.submissionTopic}" was edited by ${p.actorName}`, p);
  }

  async onReviewDeleted(p: ReviewPayload) {
    await this.notify('REVIEW_DELETED', `${this.reviewLabel(p.reviewType)} review for submission "${p.submissionTopic}" was deleted by ${p.actorName}`, p);
  }

  // ── Files — main ──────────────────────────────────────────────────────────

  async onFileMainUploaded(p: FilePayload) {
    await this.notify('FILE_MAIN_UPLOADED', `Main file "${p.filename}" for submission "${p.submissionTopic}" was uploaded`, p);
  }

  async onFileMainEdited(p: FilePayload) {
    await this.notify('FILE_MAIN_EDITED', `Main file "${p.filename}" for submission "${p.submissionTopic}" was replaced`, p);
  }

  async onFileMainDeleted(p: FilePayload) {
    await this.notify('FILE_MAIN_DELETED', `Main file "${p.filename}" for submission "${p.submissionTopic}" was deleted`, p);
  }

  // ── Files — attachments ───────────────────────────────────────────────────

  async onFileAttachmentUploaded(p: FilePayload) {
    await this.notify('FILE_ATTACHMENT_UPLOADED', `Attachment "${p.filename}" for submission "${p.submissionTopic}" was uploaded`, p);
  }

  async onFileAttachmentEdited(p: FilePayload) {
    await this.notify('FILE_ATTACHMENT_EDITED', `Attachment "${p.filename}" for submission "${p.submissionTopic}" was replaced`, p);
  }

  async onFileAttachmentDeleted(p: FilePayload) {
    await this.notify('FILE_ATTACHMENT_DELETED', `Attachment "${p.filename}" for submission "${p.submissionTopic}" was deleted`, p);
  }

  // ── Files — review documents ──────────────────────────────────────────────

  async onFileUploaded(p: FilePayload) {
    await this.notify('FILE_UPLOADED', `Review file "${p.filename}" for submission "${p.submissionTopic}" was uploaded`, p);
  }

  async onFileEdited(p: FilePayload) {
    await this.notify('FILE_EDITED', `Review file "${p.filename}" for submission "${p.submissionTopic}" was replaced`, p);
  }

  async onFileDeleted(p: FilePayload) {
    await this.notify('FILE_DELETED', `Review file "${p.filename}" for submission "${p.submissionTopic}" was deleted`, p);
  }
}
