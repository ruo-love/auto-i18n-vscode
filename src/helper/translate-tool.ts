import * as vscode from 'vscode';
import * as crypto from 'crypto';
import axios from 'axios';


class TranslateTool {
    static async  fanyiByYoudao(word: string): Promise<string> {
        /**
         * 使用有道翻译 WEB API 获取翻译结果
         */
    
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
            'Referer': 'http://fanyi.youdao.com/',
            'Cookie': 'OUTFOX_SEARCH_USER_ID=-148473857@10.169.0.83; JSESSIONID=aaafbpaaZm1Q5-_wxwLgx; OUTFOX_SEARCH_USER_ID_NCOO=982336911.512214; ___rl__test__cookies=1587617780880',
        };
        const ts = String(Date.now());
        const salt = ts + String(Math.floor(Math.random() * 10));
        const sign = crypto.createHash('md5').update(`fanyideskweb${words}${salt}Y2FYu%TNSbMCxc3t2u^XT`).digest('hex');
        const data = {
            i: words,
            from: lang[0],
            to: lang[1],
            smartresult: 'dict',
            client: 'fanyideskweb',
            salt: salt,
            sign: sign,
            ts: ts,
            bv: crypto.createHash('md5').update(headers['User-Agent']).digest('hex'),
            doctype: 'json',
            version: '2.1',
            keyfrom: 'fanyi.web',
            action: 'FY_BY_CLICKBUTTION'
        };
        try {
            const response = await axios.post('http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule', new URLSearchParams(data as any), { headers });
            const res = response.data.translateResult;
            return res ? res[0].map((r: any) => r.tgt).join('') : '翻译时出错';
        } catch (error: any) {
            return 'error info 2: ' + error.message;
        }
    }
    static async  fanyiByBaidu(appid: string, key: string, word: string): Promise<string> {
        /**
         * 使用百度翻译API 获取翻译结果 https://fanyi-api.baidu.com/manage/developer
         */
        if (!appid || !key) {
            return '请先配置 API Key';
        }
        if (!word) {
            return '翻译内容不能为空';
        }
        const salt = new Date().getTime();
        // 生成签名
        const str1 = appid + query + salt + key;
        const sign = crypto.createHash('md5').update(str1).digest('hex');
        const params = {
            q: query,
            appid: appid,
            salt: salt,
            from: from,
            to: to,
            sign: sign
        }
        try {
            const response = await axios.get('http://api.fanyi.baidu.com/api/trans/vip/translate', { params: params })
            return response.data.trans_result[0].dst
        } catch (error) {
            console.error(error);
            return '翻译时出错'
        }
    }
}
