const log = (line:string, text:string) => {
	console.log(line)
	return `${text}\n${line}`
}

const logHeaders = (headers:Headers, text:string) => {
	let lines = ''
	for (const header of headers) {
		lines = log(` ${header[0]}: ${header[1]}`, lines)
	}
	return `${text}${lines}`
}

const test = async (url:string, method:string) => {
  try {
		const u = new URL(url)
		const headers = new Headers()
		headers.set('host', u.host)
		headers.set('x-twintag-cloudflare-trace', `${Math.floor(Date.now())}`)
	
		// log request
		let text = log('\nChecking ...\n', '')
		text = log(`${method} ${url}`, text)
		text = logHeaders(headers, text)

		// execute fetch
    const rsp = await fetch(url, {
			method: method,
			headers: headers,
		})

		// log response
		text = log(`Status ${rsp.status} `, text)
		text = logHeaders(rsp.headers, text)
	
		// log body length
    const body = await rsp.text()
		text = log(`${body.length} body bytes`, text)

		return text
  } catch(err) {
		console.error(err)
		return `${err}`
  }
}

export default {
	async fetch(request: Request): Promise<Response> {
		let text = ''

		text = log('Serving from Cloudflare worker:', text)
		text = log(`${request.method} ${request.url}`, text)
		text = logHeaders(request.headers, text)

		let result = ''
		// result += await test('https://twintag.io', 'GET')
		// result += await test('https://twintag.io/ABCD', 'GET')
		// result += await test('https://twintag.io/ABCD', 'POST')
		// result += await test('https://sosvertigo-dev.twintag.io/', 'GET')
		// result += await test('https://admin.twintag.io', 'GET')

		result += await test('https://7588-87-67-226-224.eu.ngrok.io/', 'POST')

		return new Response(`${text}\n${result}`, {status: 200})
	},
};
