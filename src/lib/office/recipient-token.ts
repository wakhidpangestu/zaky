import { createHmac } from 'node:crypto';
/** Stable bearer secret for safe request replay; never derived from public record identifiers alone. */
export function recipientToken(
  secret: string,
  institutionId: string,
  actorId: string,
  requestId: string,
) {
  return createHmac('sha256', secret)
    .update('office-confirmation:v1:' + institutionId + ':' + actorId + ':' + requestId)
    .digest('base64url');
}
