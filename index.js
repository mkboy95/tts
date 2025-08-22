// index.js
export default {
    async fetch(request, env, ctx) {
        // 新增：处理音色列表请求
        if (request.url.endsWith('/v1/voices') && request.method === 'GET') {
            const voices = {
                female: [
                    { id: "zh-CN-XiaoxiaoNeural", name: "晓晓 (温柔)" },
                    { id: "zh-CN-XiaoyiNeural", name: "晓伊 (甜美)" },
                    { id: "zh-CN-XiaochenNeural", name: "晓辰 (知性)" },
                    { id: "zh-CN-XiaohanNeural", name: "晓涵 (优雅)" },
                    { id: "zh-CN-XiaomengNeural", name: "晓梦 (梦幻)" },
                    { id: "zh-CN-XiaomoNeural", name: "晓墨 (文艺)" },
                    { id: "zh-CN-XiaoqiuNeural", name: "晓秋 (成熟)" },
                    { id: "zh-CN-XiaoruiNeural", name: "晓睿 (智慧)" },
                    { id: "zh-CN-XiaoshuangNeural", name: "晓双 (活泼)" },
                    { id: "zh-CN-XiaoxuanNeural", name: "晓萱 (清新)" },
                    { id: "zh-CN-XiaoyanNeural", name: "晓颜 (柔美)" },
                    { id: "zh-CN-XiaoyouNeural", name: "晓悠 (悠扬)" },
                    { id: "zh-CN-XiaozhenNeural", name: "晓甄 (端庄)" }
                ],
                male: [
                    { id: "zh-CN-YunxiNeural", name: "云希 (清朗)" },
                    { id: "zh-CN-YunyangNeural", name: "云扬 (阳光)" },
                    { id: "zh-CN-YunjianNeural", name: "云健 (稳重)" },
                    { id: "zh-CN-YunfengNeural", name: "云枫 (磁性)" },
                    { id: "zh-CN-YunhaoNeural", name: "云皓 (豪迈)" },
                    { id: "zh-CN-YunxiaNeural", name: "云夏 (热情)" },
                    { id: "zh-CN-YunyeNeural", name: "云野 (野性)" },
                    { id: "zh-CN-YunzeNeural", name: "云泽 (深沉)" }
                ]
            };
            return new Response(JSON.stringify(voices, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*', // 允许跨域访问
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                }
            });
        }

        // 处理跨域预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // 处理语音合成请求（原有功能）
        if (request.url.endsWith('/v1/audio/speech') && request.method === 'POST') {
            try {
                const body = await request.json();
                const {
                    input,
                    voice = "zh-CN-XiaoxiaoNeural",
                    speed = 1.0,
                    pitch = "0",
                    style = "general",
                    volume = "0"
                } = body;

                if (!input) {
                    return new Response(JSON.stringify({ error: "input is required" }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // 构建Microsoft Edge TTS请求参数
                const ttsParams = new URLSearchParams({
                    'format': 'audio-24khz-48kbitrate-mono-mp3',
                    'voice': voice,
                    'speed': speed,
                    'pitch': pitch,
                    'style': style,
                    'volume': volume
                });

                const ttsUrl = `https://edge.microsoft.com/translate/tts?${ttsParams}`;
                const ttsResponse = await fetch(ttsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    body: `<speak version='1.0' xml:lang='zh-CN'><voice xml:lang='zh-CN' xml:gender='Female' name='${voice}'>${input}</voice></speak>`
                });

                if (!ttsResponse.ok) {
                    throw new Error(`TTS service error: ${ttsResponse.status}`);
                }

                const audioBuffer = await ttsResponse.arrayBuffer();
                return new Response(audioBuffer, {
                    headers: {
                        'Content-Type': 'audio/mpeg',
                        'Access-Control-Allow-Origin': '*'
                    }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 处理根路径请求（返回简单说明）
        if (new URL(request.url).pathname === '/') {
            return new Response(`
                <h1>声音魔法师 API</h1>
                <p>POST /v1/audio/speech - 语音合成接口</p>
                <p>GET /v1/voices - 获取音色列表接口</p>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // 404 响应
        return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
