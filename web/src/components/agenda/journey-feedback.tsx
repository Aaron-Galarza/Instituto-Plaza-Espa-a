'use client';

import type { ScheduleValidationResponse } from '@plaza/shared';
import { ErrorBox } from '@/components/ui';
import { AlertIcon, CheckIcon } from '@/components/icons';

export interface JourneyIssue {
  path: string;
  message: string;
}

export function JourneyFeedback({ serverError, clientIssues, validation, issues }: {
  serverError: string | null;
  clientIssues: JourneyIssue[];
  validation: ScheduleValidationResponse | null;
  issues: JourneyIssue[];
}) {
  return (
    <>
      {serverError ? <ErrorBox message={serverError} /> : null}
      {clientIssues.length > 0 ? (
        <div className="error-box" role="alert">
          <strong className="tiny" style={{ display: 'block', marginBottom: 4 }}>
            Revisá los datos
          </strong>
          <ul className="plain-list">
            {clientIssues.slice(0, 6).map((issue, index) => (
              <li key={`${issue.path}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {validation ? (
        <div className={validation.errors.length > 0 ? 'error-box' : 'success-box'} role="status">
          <strong className="row gap-6" style={{ marginBottom: 4 }}>
            {validation.errors.length > 0 ? <AlertIcon /> : <CheckIcon />}
            {validation.errors.length > 0
              ? `${validation.errors.length} conflicto${validation.errors.length === 1 ? '' : 's'} bloqueante${validation.errors.length === 1 ? '' : 's'}`
              : 'Sin conflictos bloqueantes'}
          </strong>
          {validation.errors.length > 0 ? (
            <ul className="plain-list">
              {validation.errors.map((conflict) => (
                <li key={conflict.id}>{conflict.message}</li>
              ))}
            </ul>
          ) : null}
          {validation.warnings.length > 0 ? (
            <p className="small" style={{ margin: '6px 0 0' }}>
              {validation.warnings.length} advertencia
              {validation.warnings.length === 1 ? '' : 's'}:{' '}
              {validation.warnings.map((conflict) => conflict.message).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
      {serverError && issues.length > 0 ? (
        <div className="stack gap-6">
          {issues.slice(0, 8).map((issue, index) => (
            <div className="conflict-item" key={`${issue.path}-${index}`}>
              <span className="conflict-mark" data-severity="error" />
              <div>
                <div>{issue.message}</div>
                <span className="tiny muted">{issue.path}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
