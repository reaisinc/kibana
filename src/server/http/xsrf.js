import { forbidden } from 'boom';

export default function (kbnServer, server, config) {
  const token = config.get('server.xsrf.token');
  const disabled = config.get('server.xsrf.disableProtection');

  const stateOpts = {
    isSecure: config.get('server.ssl.enabled'),
    isHttpOnly: false,
    path: '/',
  };

  server.ext('onPostAuth', function (req, reply) {
    if (disabled) return reply.continue();

    if (req.method === 'get' && !req.state['XSRF-TOKEN'] && !req.headers['x-xsrf-token']) {
      reply.state('XSRF-TOKEN', token, stateOpts);
    }

    if (req.method === 'get' || req.headers['x-xsrf-token'] === token) {
      return reply.continue();
    }

    if (!req.headers['x-xsrf-token']) {
      return reply(forbidden('Missing XSRF token'));
    }

    return reply(forbidden('Invalid XSRF token'));
  });
}
