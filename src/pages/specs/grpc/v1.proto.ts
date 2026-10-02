import spec from '../../../../specs/grpc/v1/apiculture.proto?raw';
import { serveSpec } from '../../../lib/serve-spec';

export const GET = serveSpec(spec, 'text/plain');
