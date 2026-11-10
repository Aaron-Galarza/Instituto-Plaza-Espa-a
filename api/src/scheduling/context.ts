import type { DataStore } from '../database/data-store';
import type { SchedulingContext } from './scheduling.types';

/** Carga una foto de las colecciones que participan de la programación. */
export async function loadSchedulingContext(store: DataStore): Promise<SchedulingContext> {
  const [
    rules,
    exceptions,
    groups,
    services,
    spaces,
    professionals,
    patients,
    insurers,
    availability,
    issues,
  ] = await Promise.all([
    store.repo('scheduleRules').all(),
    store.repo('scheduleExceptions').all(),
    store.repo('careGroups').all(),
    store.repo('services').all(),
    store.repo('spaces').all(),
    store.repo('professionals').all(),
    store.repo('patients').all(),
    store.repo('insurers').all(),
    store.repo('professionalAvailability').all(),
    store.repo('assignmentIssues').all(),
  ]);
  return {
    rules,
    exceptions,
    groups,
    services,
    spaces,
    professionals,
    patients,
    insurers,
    availability,
    issues,
  };
}
