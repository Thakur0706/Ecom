import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDatabase();

  app.listen(env.port, () => {
    if (env.enableBackendLogs) {
      console.log(`CampusConnect backend running on port ${env.port}`);
    }
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
