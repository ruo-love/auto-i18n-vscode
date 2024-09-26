import * as vscode from 'vscode';
import * as crypto from 'crypto';
import axios from 'axios';
import * as http from "http";
import { v4 as uuidv4 } from 'uuid';
import * as querystring from "querystring";

// class YoudaoTool {
//     static async Youdao(word: string): Promise<string> {
//         const ts = String(Date.now());
//         const salt = ts + String(Math.floor(Math.random() * 10));
//         const sign = crypto.createHash('md5').update(`fanyideskweb${words}${salt}Y2FYu%TNSbMCxc3t2u^XT`).digest('hex');
//         const data = {
//             i: words,
//             from: lang[0],
//             to: lang[1],
//             smartresult: 'dict',
//             client: 'fanyideskweb',
//             salt: salt,
//             sign: sign,
//             ts: ts,
//             bv: crypto.createHash('md5').update(headers['User-Agent']).digest('hex'),
//             doctype: 'json',
//             version: '2.1',
//             keyfrom: 'fanyi.web',
//             action: 'FY_BY_CLICKBUTTION'
//         };
//         try {
//             const response = await axios.post('http://fanyi.youdao.com/Youdao_o?smartresult=dict&smartresult=rule', new URLSearchParams(data as any), { headers });
//             const res = response.data.YoudaoResult;
//             return res ? res[0].map((r: any) => r.tgt).join('') : '翻译时出错';
//         } catch (error: any) {
//             return 'error info 2: ' + error.message;
//         }
//     }
//     static async Baidu(appid: string, key: string, word: string): Promise<string> {
//         if (!appid || !key) {
//             return '请先配置 API Key';
//         }
//         if (!word) {
//             return '翻译内容不能为空';
//         }
//         const salt = new Date().getTime();
//         // 生成签名
//         const str1 = appid + query + salt + key;
//         const sign = crypto.createHash('md5').update(str1).digest('hex');
//         const params = {
//             q: query,
//             appid: appid,
//             salt: salt,
//             from: from,
//             to: to,
//             sign: sign
//         }
//         try {
//             const response = await axios.get('http://api.fanyi.baidu.com/api/trans/vip/Youdao', { params: params })
//             return response.data.trans_result[0].dst
//         } catch (error) {
//             console.error(error);
//             return '翻译时出错'
//         }
//     }
//     private md5(content: string): string {
//         let md5 = crypto.createHash("md5");
//         md5.update(content);
//         let req = md5.digest("hex");
//         return req;
//     }
//     private sign(a: { [key: string]: string }, s: string) {
//         let signStr = a.appKey + a.q + a.salt + s;
//         a.sign = this.md5(signStr).toUpperCase();
//     }

//     private guid(): string {
//         return uuidv4();
//     }

// }


export class Youdao {
    static translate(question: string, config: { appKey: string; appSecret: string; toLang: string }): any {
        const appKey = config.appKey;
        const appSecret = config.appSecret;
        const to = Youdao.Lang[config.toLang];
        const q = question;
        const salt = uuidv4();
        const sign = this.sign({
            appKey,
            appSecret,
            q,
            salt
        });
        const params = {
            q,
            from: Youdao.Lang["中文"],
            to,
            appKey,
            salt,
            sign,
        };
        return new Promise((resolve, reject) => {
            const reqUrl = Youdao.API_URL + querystring.stringify(params);
            http
                .get(reqUrl, (res) => {
                    const { statusCode } = res;
                    const contentType = res.headers["content-type"];
                    let error;
                    if (statusCode !== 200) {
                        error = new Error("请求失败。\n" + `状态码: ${statusCode}`);
                    } else if (
                        contentType === undefined ||
                        !/^application\/json/.test(contentType)
                    ) {
                        error = new Error(
                            "无效的 content-type.\n" +
                            `期望 application/json 但获取的是 ${contentType}`
                        );
                    }
                    if (error) {
                        console.error(error.message);
                        vscode.window.showErrorMessage(`错误: ${error.message}`);
                        // 消耗响应数据以释放内存
                        res.resume();
                        return;
                    }

                    res.setEncoding("utf8");
                    let rawData = "";
                    res.on("data", (chunk) => {
                        rawData += chunk;
                    });
                    res.on("end", () => {
                        try {
                            const parsedData: {
                                errorCode: string;
                                errorMsg: string;
                                translation: string;
                                web: Array<any>;
                            } = JSON.parse(rawData);
                            if (parsedData.errorCode !== "0") {
                                let msg = Youdao.ErrorCode[parsedData.errorCode];
                                parsedData.errorMsg = msg !== undefined ? msg : "";
                                vscode.window.showErrorMessage(parsedData.errorMsg);
                            } else {
                                const inputText = q;
                                const outputText = parsedData.translation[0];
                                resolve({ inputText, outputText });
                            }
                        } catch (e: any) {
                            reject(e);
                        }
                    });
                })
                .on("error", (e) => {
                    console.error(`错误: ${e.message}`);
                    vscode.window.showErrorMessage(`错误: ${e.message}`);
                });
        });
    }
    private static API_URL = "http://openapi.youdao.com/api?";
    private static ErrorCode: { [key: string]: string } = {
        "101": "缺少必填的参数",
        "102": "不支持的语言类型",
        "103": "翻译文本过长",
        "104": "不支持的API类型",
        "105": "不支持的签名类型",
        "106": "不支持的响应类型",
        "107": "不支持的传输加密类型",
        "108": "appKey无效",
        "109": "batchLog格式不正确",
        "110": "无相关服务的有效实例",
        "111": "开发者账号无效",
        "113": "q不能为空",
        "201": "解密失败，可能为DES,BASE64,URLDecode的错误",
        "202": "签名检验失败",
        "203": "访问IP地址不在可访问IP列表",
        "205": "请求的接口与应用的平台类型不一致",
        "301": "辞典查询失败",
        "302": "翻译查询失败",
        "303": "服务端的其它异常",
        "401": "账户已经欠费",
        "411": "访问频率受限,请稍后访问",
        "412": "长请求过于频繁，请稍后访问",
    };
    private static Lang: { [key: string]: string } = {
        "中文": "zh-CHS",
        "日文": "ja",
        "英文": "EN",
        "韩文": "ko",
        "法文": "fr",
        "俄文": "ru",
        "葡萄牙文": "pt",
        "西班牙文": "es",
        "越南文": "vi"
    };
    private static md5(content: string): string {
        const md5 = crypto.createHash("md5");
        md5.update(content);
        return md5.digest("hex");
    }
    private static sign({
        appKey,
        appSecret,
        q,
        salt }: any) {
        let signStr = appKey + q + salt + appSecret;
        return this.md5(signStr).toUpperCase();
    }
}

class TextFilter {
    public static COMPILE: RegExp = /[A-Z]{1}[a-z]+/g;
    public static COMPILE_CHAR: RegExp = /[-_\n\r\t*]/g;
    public static COMPILE_SPAN: RegExp = /[\ ]+/g;
    public static filter(q: string): string {
        q = q.replace(TextFilter.COMPILE, (e) => {
            return " " + e;
        });
        q = q.replace(TextFilter.COMPILE_CHAR, " ");
        q = q.replace(TextFilter.COMPILE_SPAN, " ");
        return q;
    }
}