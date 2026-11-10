import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { InsurersModule } from './insurers/insurers.module';
import { ServicesModule } from './services/services.module';
import { SpacesModule } from './spaces/spaces.module';
import { CareGroupsModule } from './care-groups/care-groups.module';
import { ScheduleModule } from './scheduling/schedule.module';
import { AvailabilityModule } from './availability/availability.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthGuard, PermissionsGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    ProfessionalsModule,
    InsurersModule,
    ServicesModule,
    SpacesModule,
    CareGroupsModule,
    ScheduleModule,
    AvailabilityModule,
    ChangeRequestsModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
