import spec from '../../../../specs/soap/v1/apiculture.wsdl?raw';
import { serveSpec } from '../../../lib/serve-spec';

export const GET = serveSpec(spec, 'application/wsdl+xml');
