require('./src/server');

setTimeout(async () => {
  try {
    const { runTests } = require('./test-api');
    await runTests();
    console.log('[Self-Test] All tests succeeded cleanly!');
    process.exit(0);
  } catch (err) {
    console.error('[Self-Test Error]:', err);
    process.exit(1);
  }
}, 2000);
