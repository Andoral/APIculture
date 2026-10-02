import spec from '../../../../specs/rest/v1/openapi.yaml?raw';
import { serveSpec } from '../../../lib/serve-spec';

export const GET = serveSpec(spec, 'application/yaml');
