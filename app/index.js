const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { FastifyAdapter } = require('@bull-board/fastify');
const { Queue: QueueMQ } = require('bullmq');
const fastify = require('fastify');

const redisOptions = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost'
};
console.log(redisOptions);
const pillBugQueue = new QueueMQ(process.env.QUEUE_NAME, { connection: redisOptions });

(async () => {
  try {
    const app = fastify();

    const serverAdapter = new FastifyAdapter();

    createBullBoard({
      queues: [
        new BullMQAdapter(pillBugQueue)
      ],
      serverAdapter
    });

    serverAdapter.setBasePath('/admin/queues');
    app.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });

    app.get('/add', (req, reply) => {
      const opts = req.query.opts || {};

      if (opts.delay) {
        opts.delay = +opts.delay * 1000; // delay must be a number
      }

      pillBugQueue.add('Add', { title: req.query.title }, opts);

      reply.send({
        ok: true
      });
    });

    await app.listen({ port: 3000, host: '0.0.0.0' });

    // eslint-disable-next-line no-console
    console.log('Running on 3000...');
    console.log('For the UI, open http://localhost:3000/admin/queues');
    console.log('To populate the queue, run:');
    console.log('  curl http://localhost:3000/add?title=Example');
    console.log('To populate the queue with custom options (opts), run:');
    console.log('  curl http://localhost:3000/add?title=Test&opts[delay]=9');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
