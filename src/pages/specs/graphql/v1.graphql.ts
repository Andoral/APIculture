import spec from '../../../../specs/graphql/v1/schema.graphql?raw';
import { serveSpec } from '../../../lib/serve-spec';

export const GET = serveSpec(spec, 'text/plain');
