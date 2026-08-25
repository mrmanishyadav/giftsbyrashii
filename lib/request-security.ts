import { getSiteUrl } from './site-url';
export function assertSameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return;const expected=new URL(getSiteUrl()||request.url).origin;if(new URL(origin).origin!==expected)throw new Error('Cross-origin request rejected.');}
export function safeFilename(original:string){const ext=original.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'')??'bin';return`${crypto.randomUUID()}.${ext}`}
