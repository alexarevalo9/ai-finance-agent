import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { financialProfileAgent } from './agents/financial-profile-agent';
import { financialHealthAgent } from './agents/financial-health-agent';

export const mastra = new Mastra({
  agents: {
    financialProfileAgent,
    financialHealthAgent,
  },
  storage: new LibSQLStore({
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
