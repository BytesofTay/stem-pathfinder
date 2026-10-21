import applicationData from '../../../lausd_magnet_app/web/application-data.js';
import { APPLICATION_GUIDANCE } from './verified-programs.mjs';

const { ApplicationGuidanceUtils } = applicationData;

// The clock comes from the server, never from user/model tool arguments.
// Data is generated/freshness-checked; pure date logic is shared with the browser.
export function getApplicationGuidance({ language = 'en', topic = 'all', now = new Date() } = {}) {
  return ApplicationGuidanceUtils.localizedView(APPLICATION_GUIDANCE, { language, topic, now });
}
