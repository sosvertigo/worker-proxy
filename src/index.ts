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

const test = async (url:string, method:string) => {
  try {
		console.log('TEST', method, url)
    const rsp = await fetch(url, {
			method: method,
		})
    for (const header of rsp.headers) {
			console.log('TEST', header[0], ':', header[1])
    }
		console.log('TEST', 'status', rsp.status)
    const text = await rsp.text()
    console.log('TEST',text.length, 'body bytes')
  } catch(err) {
    console.log(err)
  }
}


export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		
		// Expect x-twintag-<something> headers
		const url = request.headers.get('x-twintag-url')
		if (!url) {
			return new Response('missing x-twintag-url header', {status: 502})
		}
		const method = request.headers.get('x-twintag-method')
		if (!method) {
			return new Response('missing x-twintag-method header', {status: 502})
		}

		await test(url, method)

		console.log('PROXY', method, url)

		for (const header of request.headers) {
			console.log('PROXY','  ', header[0], header[1])
    }

		// copy all headers except x-twintag-<something>
		const headers = new Headers()
		for (const header of request.headers) {
			if (header[0].startsWith('x-twintag-')) {
				continue
			}
      headers.set(header[0], header[1])
    }
		
		const rsp = await fetch(url, {
			method: method,
			headers: headers,
		})

		console.log('PROXY', 'status', rsp.status)
		for (const header of rsp.headers) {
			console.log('PROXY', '  ', header[0], header[1])
    }

		return rsp
	},
};
