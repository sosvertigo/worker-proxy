/**
 * Cloudflare Worker code
 */

export interface Env {}

const log = (line:string, text:string) => {
	console.log(line)
	return `${text}\n${line}`
}

const test = async (label:string, url:string, method:string, headers = new Headers()) => {
  try {
		let text = log(`${label}`, '')

		headers.set('x-twintag-cloudflare-trace', `${Math.floor(Date.now())}`)
		text = log(` ${method} ${url}`, text)
		for (const header of headers) {
			text = log(`   ${header[0]}: ${header[1]}`, text)
    }

    const rsp = await fetch(url, {
			method: method,
			headers: headers,
		})

		text = log(` status ${rsp.status} `, text)
		for (const header of rsp.headers) {
			text = log(`   ${header[0]}: ${header[1]}`, text)
    }

    const body = await rsp.text()
		text = log(` ${body.length} body bytes`, text)

		return text
  } catch(err) {
		console.error(err)
		return `${err}`
  }
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		let text = ''

		text = log('SERVING from Cloudflare worker:', text)
		text = log(`${request.method} ${request.url}`, text)
		for (const header of request.headers) {
			text = log(` ${header[0]}: ${header[1]}`, text)
    }

		const url = request.headers.get('x-twintag-url')
		const method = request.headers.get('x-twintag-method')

		if (!url) {
			return new Response('missing x-twintag-url header', {status: 502})
		}
		if (!method) {
			return new Response('missing x-twintag-method header', {status: 502})
		}

		const result = await test('INDIRECTLY fetching:',url, method)
		return new Response(`${text}\n${result}`, {status: 200})
	},
};
