const log = (line:string, text:string) => {
	console.log(line)
	return `${text}\n${line}`
}

const logHeaders = (headers:Headers, text:string) => {
	let lines = ''
	for (const header of headers) {
		lines = log(`   ${header[0]}: ${header[1]}`, lines)
	}
	return `${text}\n${lines}`
}

const test = async (url:string, method:string) => {
  try {
		const headers = new Headers()
		headers.set('x-twintag-cloudflare-trace', `${Math.floor(Date.now())}`)
	
		// log request
		let text = log('FETCHING', '')
		text = log(`${method} ${url}`, '')
		text = logHeaders(headers, text)

		// execute fetch
    const rsp = await fetch(url, {
			method: method,
			headers: headers,
		})

		// log response
		text = log(` status ${rsp.status} `, text)
		text = logHeaders(rsp.headers, text)
	
		// log body length
    const body = await rsp.text()
		text = log(` ${body.length} body bytes`, text)

		return text
  } catch(err) {
		console.error(err)
		return `${err}`
  }
}

export default {
	async fetch(request: Request): Promise<Response> {
		let text = ''

		text = log('SERVING from Cloudflare worker:', text)
		text = log(`${request.method} ${request.url}`, text)
		text = logHeaders(request.headers, text)

		const result = await test('https://twintag.io/ABCD', 'POST')

		return new Response(`${text}\n${result}`, {status: 200})
	},
};
