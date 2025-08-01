import { AutoRouter, IRequest } from 'itty-router';
import { handleProcessUpdates } from './routes/process-updates';
import { handleSendNotifications } from './routes/send-notifications';
import { Env, CFArgs } from './types';

const router = AutoRouter<IRequest, CFArgs>();

router.post('/send-notifications/:chatId', (request: IRequest, env: Env, ctx: ExecutionContext) => 
  handleSendNotifications(request, env, '18xx.games', request.params.chatId)
);

router.post('/:botId/process-updates', (request: IRequest, env: Env, ctx: ExecutionContext) => 
  handleProcessUpdates(request, env, request.params.botId)
);

router.post('/:botId/:chatId?', (request: IRequest, env: Env, ctx: ExecutionContext) => 
  handleSendNotifications(request, env, request.params.botId, request.params.chatId)
);

router.all('*', () => new Response('Not Found', { status: 404 }));

export default router;
 