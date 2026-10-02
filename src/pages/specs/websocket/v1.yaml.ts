import spec from '../../../../specs/websocket/v1/asyncapi.yaml?raw';
import { serveSpec } from '../../../lib/serve-spec';

export const GET = serveSpec(spec, 'application/yaml');
