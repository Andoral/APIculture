const headers = {
	Authorization: 'Bearer ak_test_smoke',
	'Content-Type': 'application/json',
	'Idempotency-Key': 'smoke-1',
};

const apiary = await (
	await fetch('http://127.0.0.1:8787/v1/apiaries', {
		method: 'POST',
		headers,
		body: JSON.stringify({ name: 'Orchard apiary', location: { latitude: 55.7558, longitude: 37.6173 } }),
	})
).json();
console.log('REST create', apiary);

const again = await (
	await fetch('http://127.0.0.1:8787/v1/apiaries', {
		method: 'POST',
		headers,
		body: JSON.stringify({ name: 'Orchard apiary', location: { latitude: 55.7558, longitude: 37.6173 } }),
	})
).json();
console.log('REST idempotent', again.id === apiary.id);

const gql = await (
	await fetch('http://127.0.0.1:8787/graphql', {
		method: 'POST',
		headers: { Authorization: 'Bearer ak_test_smoke', 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: '{ apiaries { edges { node { id name hiveCount } } pageInfo { hasNextPage } } }' }),
	})
).json();
console.log('GraphQL', JSON.stringify(gql));

const soap = await (
	await fetch('http://127.0.0.1:8787/soap/v1', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ak_test_smoke',
			'Content-Type': 'text/xml',
			SOAPAction: 'https://api.apiculture.example/soap/v1/ListApiaries',
		},
		body: '<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ListApiaries xmlns="https://api.apiculture.example/soap/v1"><limit>20</limit></ListApiaries></soap:Body></soap:Envelope>',
	})
).text();
console.log('SOAP', soap);

const hive = await (
	await fetch('http://127.0.0.1:8787/v1/hives', {
		method: 'POST',
		headers: { Authorization: 'Bearer ak_test_smoke', 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiary_id: apiary.id, label: 'Hive 7' }),
	})
).json();
console.log('Hive', hive);

const live = await fetch('http://127.0.0.1:8787/v1/apiaries', {
	headers: { Authorization: 'Bearer ak_live_nope' },
});
console.log('Live key', live.status, await live.json());

if (!apiary.id || again.id !== apiary.id || gql.errors || !gql.data?.apiaries?.edges?.length || !soap.includes(apiary.id) || !hive.id) {
	process.exit(1);
}
