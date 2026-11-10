import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, DATA_STORE } from '../config/tokens';
import type { AppConfig } from '../config/env';
import { JsonDataStore } from './json-data-store';
import { MongoDataStore } from './mongo-data-store';
import type { DataStore } from './data-store';
import { AppLogger } from '../common/logger';

@Global()
@Module({
  providers: [
    {
      provide: DATA_STORE,
      inject: [APP_CONFIG],
      useFactory: async (config: AppConfig): Promise<DataStore> => {
        if (config.dataBackend === 'mongodb') {
          const store = new MongoDataStore(config.mongoUri!, config.mongoDb);
          await store.init();
          AppLogger.log(`Persistencia MongoDB: ${config.mongoDb}`, 'DatabaseModule');
          return store;
        }
        const store = await JsonDataStore.create(config.dataFile);
        AppLogger.log(`Persistencia JSON: ${config.dataFile}`, 'DatabaseModule');
        return store;
      },
    },
  ],
  exports: [DATA_STORE],
})
export class DatabaseModule {}
