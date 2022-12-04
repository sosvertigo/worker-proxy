/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

const test = async (label:string, url:string, method:string) => {
	let result = ''
	let line = ''
  try {
		line = `${label} ${method} ${url}`
		console.log(line)
		result += `${line}\n`
    const rsp = await fetch(url, {
			method: method,
		})

		line = `status ${rsp.status} `
		console.log(line)
		result += `${line}\n`

		for (const header of rsp.headers) {
			line = `  ${header[0]}: ${header[1]}`
			console.log(line)
			result += `${line}\n`
    }

    const text = await rsp.text()
		line = `${text.length} body bytes`
		console.log(line)
		result += `${line}\n`
  } catch(err) {
		console.error(err)
		result = `${err}`
  }
	return result
}


export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		
		// Expect x-twintag-<something> headers to forward
		const url = request.headers.get('x-twintag-url')
		const method = request.headers.get('x-twintag-method')

		if ((url === null) || (method === null)) { // direct test?
			if (request.url.endsWith('/test')) {
				const result = await test('DIRECT','https://twintag.io', 'GET')
				return new Response(result, {status: 200})
			} else {
				console.log('UNKNOWN DIRECT PATH', request.url)
				return new Response(`${request.url}`, {status: 502})
			}
		}

		if (!url) {
			return new Response('missing x-twintag-url header', {status: 502})
		}
		if (!method) {
			return new Response('missing x-twintag-method header', {status: 502})
		}

		await test('INDIRECT',url, method)

		console.log('PROXY', method, url)
		// copy all headers except x-twintag-<something>
		const headers = new Headers()
		for (const header of request.headers) {
			if (header[0].startsWith('x-twintag-')) {
				continue
			}
      headers.set(header[0], header[1])
			console.log('  ', header[0], header[1])
    }

		const rsp = await fetch(url, {
			method: method,
			headers: headers,
		})

		console.log('PROXY', 'status', rsp.status)
		for (const header of rsp.headers) {
			console.log('  ', header[0], header[1])
    }

		return rsp
	},
};
