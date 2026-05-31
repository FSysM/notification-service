import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEvent } from './notifications.events';
import type { SubmissionPayload, AssignmentPayload, ReviewPayload, FilePayload } from './notifications.events';

@Controller()
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

  @EventPattern(NotificationEvent.SUBMISSION_APPROVED)
  async onSubmissionApproved(@Payload() data: any) {
    const p = data as SubmissionPayload;
    await this.notify('SUBMISSION_APPROVED', `Submission "${p.submissionTopic}" was approved by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.SUBMISSION_REJECTED)
  async onSubmissionRejected(@Payload() data: any) {
    const p = data as SubmissionPayload;
    await this.notify('SUBMISSION_REJECTED', `Submission "${p.submissionTopic}" was rejected by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.SUBMISSION_SUBMITTED)
  async onSubmissionSubmitted(@Payload() data: any) {
    const p = data as SubmissionPayload;
    await this.notify('SUBMISSION_SUBMITTED', `Submission "${p.submissionTopic}" was submitted by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.SUBMISSION_EDITED)
  async onSubmissionEdited(@Payload() data: any) {
    const p = data as SubmissionPayload;
    await this.notify('SUBMISSION_EDITED', `Submission "${p.submissionTopic}" was edited by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.SUBMISSION_DELETED)
  async onSubmissionDeleted(@Payload() data: any) {
    const p = data as SubmissionPayload;
    await this.notify('SUBMISSION_DELETED', `Submission "${p.submissionTopic}" was deleted by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.SUBMISSION_OPPONENT_ASSIGNED)
  async onSubmissionOpponentAssigned(@Payload() data: any) {
    const p = data as SubmissionPayload;
    await this.notify('SUBMISSION_OPPONENT_ASSIGNED', `${p.actorName} was assigned as opponent for submission "${p.submissionTopic}"`, p);
  }

  // ── Assignments ────────────────────────────────────────────────────────────

  @EventPattern(NotificationEvent.ASSIGNMENT_PICKED)
  async onAssignmentPicked(@Payload() data: any) {
    const p = data as AssignmentPayload;
    await this.notify('ASSIGNMENT_PICKED', `Assignment "${p.assignmentTopic}" was picked by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.ASSIGNMENT_UNPICKED)
  async onAssignmentUnpicked(@Payload() data: any) {
    const p = data as AssignmentPayload;
    await this.notify('ASSIGNMENT_UNPICKED', `Assignment "${p.assignmentTopic}" was unpicked by ${p.actorName}`, p);
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  @EventPattern(NotificationEvent.REVIEW_CREATED)
  async onReviewCreated(@Payload() data: any) {
    const p = data as ReviewPayload;
    await this.notify('REVIEW_CREATED', `${this.reviewLabel(p.reviewType)} review for submission "${p.submissionTopic}" was created by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.REVIEW_EDITED)
  async onReviewEdited(@Payload() data: any) {
    const p = data as ReviewPayload;
    await this.notify('REVIEW_EDITED', `${this.reviewLabel(p.reviewType)} review for submission "${p.submissionTopic}" was edited by ${p.actorName}`, p);
  }

  @EventPattern(NotificationEvent.REVIEW_DELETED)
  async onReviewDeleted(@Payload() data: any) {
    const p = data as ReviewPayload;
    await this.notify('REVIEW_DELETED', `${this.reviewLabel(p.reviewType)} review for submission "${p.submissionTopic}" was deleted by ${p.actorName}`, p);
  }

  // ── Files — main ──────────────────────────────────────────────────────────

  @EventPattern(NotificationEvent.FILE_MAIN_UPLOADED)
  async onFileMainUploaded(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_MAIN_UPLOADED', `Main file "${p.filename}" for submission "${p.submissionTopic}" was uploaded`, p);
  }

  @EventPattern(NotificationEvent.FILE_MAIN_EDITED)
  async onFileMainEdited(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_MAIN_EDITED', `Main file "${p.filename}" for submission "${p.submissionTopic}" was replaced`, p);
  }

  @EventPattern(NotificationEvent.FILE_MAIN_DELETED)
  async onFileMainDeleted(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_MAIN_DELETED', `Main file "${p.filename}" for submission "${p.submissionTopic}" was deleted`, p);
  }

  // ── Files — attachments ───────────────────────────────────────────────────

  @EventPattern(NotificationEvent.FILE_ATTACHMENT_UPLOADED)
  async onFileAttachmentUploaded(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_ATTACHMENT_UPLOADED', `Attachment "${p.filename}" for submission "${p.submissionTopic}" was uploaded`, p);
  }

  @EventPattern(NotificationEvent.FILE_ATTACHMENT_EDITED)
  async onFileAttachmentEdited(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_ATTACHMENT_EDITED', `Attachment "${p.filename}" for submission "${p.submissionTopic}" was replaced`, p);
  }

  @EventPattern(NotificationEvent.FILE_ATTACHMENT_DELETED)
  async onFileAttachmentDeleted(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_ATTACHMENT_DELETED', `Attachment "${p.filename}" for submission "${p.submissionTopic}" was deleted`, p);
  }

  // ── Files — review documents ──────────────────────────────────────────────

  @EventPattern(NotificationEvent.FILE_UPLOADED)
  async onFileUploaded(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_UPLOADED', `Review file "${p.filename}" for submission "${p.submissionTopic}" was uploaded`, p);
  }

  @EventPattern(NotificationEvent.FILE_EDITED)
  async onFileEdited(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_EDITED', `Review file "${p.filename}" for submission "${p.submissionTopic}" was replaced`, p);
  }

  @EventPattern(NotificationEvent.FILE_DELETED)
  async onFileDeleted(@Payload() data: any) {
    const p = data as FilePayload;
    await this.notify('FILE_DELETED', `Review file "${p.filename}" for submission "${p.submissionTopic}" was deleted`, p);
  }
}
