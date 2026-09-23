import { defineConfig, env } from 'prisma/config';
import { config } from './src/app/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: config.database_url
  },
});
