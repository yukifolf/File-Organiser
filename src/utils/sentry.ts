import Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from 'node-config-ts';

if (config.sentry.enabled === true) {
  Sentry.init({
    dsn: config.sentry.dsn,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: config.sentry.tracesSampleRate,
    profilesSampleRate: config.sentry.profilesSampleRate,
    environment: config.sentry.environment,
  });
} else {
  console.warn('Sentry is disabled in the configuration.');
}
