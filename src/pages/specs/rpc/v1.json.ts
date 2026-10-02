import spec from '../../../../specs/rpc/v1/openrpc.json?raw';
import { serveSpec } from '../../../lib/serve-spec';

export const GET = serveSpec(spec, 'application/json');
