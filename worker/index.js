const { Worker } = require('bullmq');

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t * 1000));
const redisOptions = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost'
};

async function setupBullMQProcessor (queueName) {
  // eslint-disable-next-line no-new
  new Worker(
    queueName,
    async (job) => {
      for (let i = 0; i <= 100; i++) {
        await sleep(Math.random());
        await job.updateProgress(i);
        await job.log(`Processing job at interval ${i}`);

        if (Math.random() * 200 < 1) throw new Error(`Random error ${i}`);
      }

      return { jobId: `This is the return value of job (${job.id})` };
    },
    { connection: redisOptions }
  );
};

(async () => {
  try {
    await setupBullMQProcessor(process.env.QUEUE_NAME);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
