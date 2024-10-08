import * as vscode from 'vscode';
import * as crypto from 'crypto';
import axios from 'axios';
import * as http from "http";
import { v4 as uuidv4 } from 'uuid';
import * as querystring from "querystring";



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
            from: "auto",
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

export class Baidu {
    static async translate(question: string, config: { appKey: string; appSecret: string; toLang: string }) {
        const appKey = config.appKey;
        const appSecret = config.appSecret;
        const to = Baidu.Lang[config.toLang];
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
            from: "auto",
            to,
            appid: appKey,
            salt,
            sign,
        };
        try {
            vscode.window.showInformationMessage(JSON.stringify(params));
            const response = await axios.get(this.API_URL, { params: params });
            if(response.data.error_code){
                vscode.window.showErrorMessage(this.ErrorCode[response.data.error_code]);
                return Promise.reject(response.data.error_code);
            }
            return { inputText: q, outputText: response.data.trans_result[0].dst };
        } catch (error:any) {
            console.error(error);
            return '翻译时出错';
        }
    }
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
        const signStr = appKey + q + salt + appSecret;
        return this.md5(signStr);
    }
    private static API_URL = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
    private static Lang: { [key: string]: string } = {
        "中文": "zh",
        "日文": "jp",
        "英文": "en",
        "韩文": "kor",
        "法文": "fra",
        "俄文": "ru",
        "葡萄牙文": "pt",
        "西班牙文": "spa",
        "越南文": "vie"
    };
    private static ErrorCode:any= {
        52000: "成功",
        52001: "请求超时：检查请求query是否超长，以及原文或译文参数是否在支持的语种列表里",
        52002: "系统错误：请重试",
        52003: "未授权用户：请检查appid是否正确或者服务是否开通",
        54000: "必填参数为空：请检查是否少传参数",
        54001: "签名错误：请检查您的签名生成方法",
        54003: "访问频率受限：请降低您的调用频率，或在控制台进行身份认证后切换为高级版/尊享版",
        54004: "账户余额不足：请前往管理控制台为账户充值",
        54005: "长query请求频繁：请降低长query的发送频率，3s后再试",
        58000: "客户端IP非法：检查个人资料里填写的IP地址是否正确，可前往开发者信息-基本信息修改",
        58001: "译文语言方向不支持：检查译文语言是否在语言列表里",
        58002: "服务当前已关闭：请前往管理控制台开启服务",
        58003: "此IP已被封禁：同一IP当日使用多个APPID发送翻译请求，则该IP将被封禁当日请求权限，次日解封。请勿将APPID和密钥填写到第三方软件中。",
        90107: "认证未通过或未生效：请前往我的认证查看认证进度",
        20003: "请求内容存在安全风险"
    }
}