'use client';

import type { AssignmentIssueDetail } from '@plaza/shared';
import { Button, EmptyState, ErrorBox, LoadingBlock, StatusBadge } from '@/components/ui';
import { AlertIcon } from '@/components/icons';
import { errorMessage } from '@/lib/api';
import { shortDate, timeRange } from '@/lib/format';
import { countLabel, type Tab, type IssueStatusFilter } from './availability-form';

type QueryState = { isLoading: boolean; isError: boolean; error: Error | null; refetch: () => unknown };

export function IssuesPanel({ tab, filteredIssues, issues, issueStatus, absenceFilter, canWrite, onClearFilter, onResolve }: {
  tab: Tab; filteredIssues: AssignmentIssueDetail[]; issues: QueryState; issueStatus: IssueStatusFilter;
  absenceFilter: { id: string; label: string } | null; canWrite: boolean; onClearFilter: () => void;
  onResolve: (issue: AssignmentIssueDetail) => void;
}) {
  return (
    <>
      {tab === 'issues' ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Afectaciones de agenda</h2>
            <span className="tiny muted">
              {countLabel(filteredIssues.length, 'afectación', 'afectaciones')}
            </span>
          </div>

          {absenceFilter ? (
            <div className="notice">
              <span>
                Mostrando las afectaciones de <strong>{absenceFilter.label}</strong>.
              </span>
              <Button size="sm" variant="ghost" onClick={() => onClearFilter()}>
                Quitar filtro
              </Button>
            </div>
          ) : null}

          {issues.isLoading ? (
            <div className="panel-pad">
              <LoadingBlock rows={5} />
            </div>
          ) : issues.isError ? (
            <div className="panel-pad">
              <ErrorBox message={errorMessage(issues.error)} />
              <Button size="sm" onClick={() => void issues.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : filteredIssues.length === 0 ? (
            <EmptyState
              title="Sin afectaciones"
              description={
                issueStatus === 'pending'
                  ? 'No hay jornadas afectadas por ausencias pendientes de resolución.'
                  : 'No hay afectaciones que coincidan con el filtro elegido.'
              }
            />
          ) : (
            <div className="issue-list">
              {filteredIssues.map((issue) => (
                <article className="issue-row" key={issue.id}>
                  <div className="issue-date">
                    <strong>{shortDate(issue.date)}</strong>
                    <span className="tabular">{timeRange(issue.startMinute, issue.endMinute)}</span>
                  </div>
                  <div className="issue-main">
                    <div className="spread" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <span className="row-title">{issue.patientName}</span>
                        <div className="tiny muted">
                          {issue.professionalName} ·{' '}
                          {issue.serviceNames.join(' · ') || 'Prestación'}
                        </div>
                      </div>
                      <StatusBadge status={issue.status} />
                    </div>
                    {issue.resolution ? (
                      <p className="tiny muted" style={{ margin: '5px 0 0' }}>
                        {issue.resolution}
                      </p>
                    ) : null}
                  </div>
                  <div className="issue-actions">
                    {issue.status === 'pending' && canWrite ? (
                      <Button size="sm" variant="primary" onClick={() => onResolve(issue)}>
                        <AlertIcon /> Resolver
                      </Button>
                    ) : issue.status === 'pending' ? (
                      <span className="tiny muted">Pendiente de coordinación</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

    </>
  );
}
