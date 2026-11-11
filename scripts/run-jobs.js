'use strict';
// Run scheduled jobs once (for a cron job or manual run): npm run jobs [-- --weekly]
const { runJobs, weeklyUpdates } = require('../src/jobs');

(async () => {
  const result = await runJobs();
  if (process.argv.includes('--weekly')) result.weekly = await weeklyUpdates();
  console.log('[jobs]', JSON.stringify(result));
})().catch((e) => { console.error(e); process.exit(1); });
