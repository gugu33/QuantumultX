/**
彩云天气 v0.1 alpha
@author: Peng-YM
更新地址：https://raw.githubusercontent.com/Peng-YM/QuanX/master/Tasks/caiyun.js
 *
功能：
√ 自动定位
√ 异常天气预警
√ 实时天气预报

TODO:
- 降雨提醒
- 每日睡前预报

配置：
1️⃣ 配置自动定位
根据平台添加如下配置
(1). Quantumult X
[MITM]
hostname=weather-data.apple.com, api.weather.com
[rewrite_local]
https:\/\/((weather-data\.apple)|(api.weather))\.com url script-request-header https://raw.githubusercontent.com/Peng-YM/QuanX/master/Tasks/caiyun.js

(2). Loon
[MITM]
hostname=weather-data.apple.com, api.weather.com
[Script]
http-request https:\/\/((weather-data\.apple)|(api.weather))\.com script-path=https://raw.githubusercontent.com/Peng-YM/QuanX/master/Tasks/caiyun.js, require-body=false

(3). Surge
[MITM]
hostname=weather-data.apple.com, api.weather.com
[Script]
type=http-request, pattern=https:\/\/((weather-data\.apple)|(api.weather))\.com, script-path=https://raw.githubusercontent.com/Peng-YM/QuanX/master/Tasks/caiyun.js, require-body=false
2️⃣ 打开手机设置 > 隐私 > 定位服务
(1) 打开定位服务
(2) 选择天气，设置永远允许天气访问位置信息，并允许使用精确位置。
此时，打开系统天气应用，会提示获取位置成功，如果没有提示，请确认1️⃣是否配置正确。
3️⃣ 配置cron任务如：10 8-22/2 * * *
4️⃣ 打开box.js设置彩云令牌(不是链接！！！）即可。
*/

/********************** SCRIPT START *********************************/
const $ = API("caiyun");
const ERR = MYERR();
<<<<<<< HEAD
const display_location = JSON.parse($.read("display_location") || "false");
=======

let display_location = $.read("display_location");
if (display_location === undefined) {
  display_location = false;
} else {
  display_location = JSON.parse(display_location);
}
>>>>>>> upstream/master

if (typeof $request !== "undefined") {
  // get location from request url
  const url = $request.url;
  const res =
    url.match(/weather\/.*?\/(.*)\/(.*)\?/) ||
    url.match(/geocode\/([0-9.]*)\/([0-9.]*)\//) ||
    url.match(/geocode=([0-9.]*),([0-9.]*)/);
  if (res === null) {
    $.notify(
      "[彩云天气]",
      "❌ 正则表达式匹配错误",
      `🥬 无法从URL: ${url} 获取位置。`
    );
    $.done({ body: $request.body });
  }
  location = {
    latitude: res[1],
    longitude: res[2],
  };
  if (!$.read("location")) {
    $.notify("[彩云天气]", "", "🎉🎉🎉 获取定位成功。");
  }
  if (display_location) {
    $.info(
      `成功获取当前位置：纬度 ${location.latitude} 经度 ${location.longitude}`
    );
  }

  $.write(res[1], "#latitude");
  $.write(res[2], "#longitude");

  $.write(location, "location");
  $.done({ body: $request.body });
} else {
  // this is a task
  !(async () => {
    const { caiyun, tencent } = $.read("token") || {};

    if (!caiyun) {
      throw new ERR.TokenError("❌ 未找到彩云Token令牌");
    } else if (caiyun.indexOf("http") !== -1) {
      throw new ERR.TokenError("❌ Token令牌 并不是 一个链接！");
    } else if (!tencent) {
      throw new ERR.TokenError("❌ 未找到腾讯地图Token令牌");
    } else if (!$.read("location")) {
      // no location
      $.notify(
        "[彩云天气]",
        "❌ 未找到定位",
        "🤖 您可能没有正确设置MITM，请检查重写是否成功。"
      );
    } else {
      await scheduler();
    }
  })()
    .catch((err) => {
      if (err instanceof ERR.TokenError)
        $.notify(
          "[彩云天气]",
          err.message,
          "🤖 由于API Token具有时效性，请前往\nhttps://t.me/cool_scripts\n获取最新Token。",
          {
            "open-url": "https://t.me/cool_scripts",
          }
        );
<<<<<<< HEAD
      else $.notify("[彩云天气]", "❌ 出现错误", err.message);
=======
      else $.notify("[彩云天气]", "❌ 出现错误", JSON.stringify(err));
>>>>>>> upstream/master
    })
    .finally($.done());
}

async function scheduler() {
  const now = new Date();
  $.log(
    `Scheduler activated at ${
      now.getMonth() + 1
    }月${now.getDate()}日${now.getHours()}时${now.getMinutes()}分`
  );
  await query();
  weatherAlert();
  realtimeWeather();
  // hourlyForcast();
  // dailyForcast();
}

async function query() {
  const location = $.read("location") || {};
  $.info(location);
  const isNumeric = (input) => input && !isNaN(input);
  if (!isNumeric(location.latitude) || !isNumeric(location.longitude)) {
    throw new Error("❌ 经纬度设置错误！");
  }

  if (Number(location.latitude) > 90 || Number(location.longitude) > 180) {
    throw new Error(
      "🤖 地理小课堂：经度的范围是0~180，纬度是0~90哦。请仔细检查经纬度是否设置正确。"
    );
  }
  // query API
  const url = `https://api.caiyunapp.com/v2.5/${$.read("token").caiyun}/${
    $.read("location").longitude
  },${
    $.read("location").latitude
  }/weather?lang=zh_CN&dailystart=0&hourlysteps=384&dailysteps=16&alert=true`;

  $.log("Query weather...");

  const weather = await $.get({
    url,
    headers: {
      "User-Agent": "ColorfulCloudsPro/5.0.10 (iPhone; iOS 14.0; Scale/3.00)",
    },
  })
    .then((resp) => {
      const body = JSON.parse(resp.body);
      if (body.status === "failed") {
        throw new Error(body.error);
      }
      return body;
    })
    .catch((err) => {
      throw err;
    });
  $.weather = weather;

  const now = new Date().getTime();
  const addressUpdated = $.read("address_updated");
  let address = $.read("address");
  if (addressUpdated === undefined || now - addressUpdated > 30 * 60 * 1000) {
    await $.wait(Math.random() * 2000);
    $.log("Query location...");
    address = await $.get(
      `https://apis.map.qq.com/ws/geocoder/v1/?key=${
        $.read("token").tencent
      }&location=${$.read("location").latitude},${$.read("location").longitude}`
    )
      .then((resp) => {
        const body = JSON.parse(resp.body);
        if (body.status !== 0) {
          throw new ERR.TokenError("❌ 腾讯地图Token错误");
        }
        return body.result.address_component;
      })
      .catch((err) => {
        throw err;
      });
    $.write(address, "address");
    $.write(now, "address_updated");
  }

  if (display_location == true) {
    $.info(JSON.stringify(address));
  }
  $.address = address;
}

function weatherAlert() {
  const data = $.weather.result.alert;
  const address = $.address;
  const alerted = $.read("alerted") || [];

  if (data.status === "ok") {
    data.content.forEach((alert) => {
      if (alerted.indexOf(alert.alertId) === -1) {
        $.notify(
          `[彩云天气] ${address.city} ${address.district} ${address.street}`,
          alert.title,
          alert.description
        );
        alerted.push(alert.alertId);
        if (alerted.length > 10) {
          alerted.shift();
        }
        $.write(alerted, "alerted");
      }
    });
  }
}

function realtimeWeather() {
  const data = $.weather.result;
  const address = $.address;

  const alert = data.alert;
  const alertInfo =
    alert.content.length == 0
      ? ""
      : alert.content.reduce((acc, curr) => {
          if (curr.status === "预警中") {
            return acc + "\n" + mapAlertCode(curr.code) + "预警";
          } else {
            return acc;
          }
        }, "[预警]") + "\n\n";

  const realtime = data.realtime;
  const keypoint = data.forecast_keypoint;

  const hourly = data.hourly;

  let hourlySkycon = "[未来3小时]\n";
  for (let i = 0; i < 3; i++) {
    const skycon = hourly.skycon[i];
    const dt = new Date(skycon.datetime);
    const now = dt.getHours() + 1;
    dt.setHours(dt.getHours() + 1);
    hourlySkycon +=
      `${now}-${dt.getHours() + 1}时 ${mapSkycon(skycon.value)[0]}` +
      (i == 2 ? "" : "\n");
  }

  $.notify(
    `[彩云天气] ${address.city} ${address.district} ${address.street}`,
    `${mapSkycon(realtime.skycon)[0]} ${realtime.temperature} ℃  🌤 空气质量 ${
      realtime.air_quality.description.chn
    }`,
    `🔱 ${keypoint}
🌡 体感${realtime.life_index.comfort.desc} ${
      realtime.apparent_temperature
    } ℃  💧 湿度 ${(realtime.humidity * 100).toFixed(0)}%
<<<<<<< HEAD
🌞 紫外线 ${realtime.life_index.ultraviolet.desc} 💨 风力 ${mapWind(realtime.wind.speed, realtime.wind.direction)}
=======
🌞 紫外线 ${realtime.life_index.ultraviolet.desc} 💨 ${mapWind(
      realtime.wind.speed,
      realtime.wind.direction
    )}
>>>>>>> upstream/master

${alertInfo}${hourlySkycon}
`,
    {
      "media-url": `${mapSkycon(realtime.skycon)[1]}`,
    }
  );
}

function dailyForcast() {}

/************************** 天气对照表 *********************************/

function mapAlertCode(code) {
  const names = {
    "01": "🌪 台风",
    "02": "⛈ 暴雨",
    "03": "❄️ 暴雪",
    "04": "❄ 寒潮",
    "05": "💨 大风",
    "06": "💨 沙尘暴",
    "07": "☄️ 高温",
    "08": "☄️ 干旱",
    "09": "⚡️ 雷电",
    "10": "💥 冰雹",
    "11": "❄️ 霜冻",
    "12": "💨 大雾",
    "13": "💨 霾",
    "14": "❄️ 道路结冰",
    "15": "🔥 森林火灾",
    "16": "⛈ 雷雨大风",
  };

  const intensity = {
    "01": "蓝色",
    "02": "黄色",
    "03": "橙色",
    "04": "红色",
  };

  const res = code.match(/(\d{2})(\d{2})/);
  return `${names[res[1]]}${intensity[res[2]]}`;
}

function mapWind(speed, direction) {
  let description = "";
<<<<<<< HEAD
  if (speed < 1) {
    description = "无风";
  } else if (speed <= 5) {
    description = "1级 清风徐徐";
=======
  let d_description = "";

  if (speed < 1) {
    description = "无风";
    return description;
  } else if (speed <= 5) {
    description = "1级 微风徐徐";
>>>>>>> upstream/master
  } else if (speed <= 11) {
    description = "2级 清风";
  } else if (speed <= 19) {
    description = "3级 树叶摇摆";
  } else if (speed <= 28) {
    description = "4级 树枝摇动";
  } else if (speed <= 38) {
    description = "5级 风力强劲";
  } else if (speed <= 49) {
    description = "6级 风力强劲";
  } else if (speed <= 61) {
    description = "7级 风力超强";
  } else if (speed <= 74) {
    description = "8级 狂风大作";
  } else if (speed <= 88) {
    description = "9级 狂风呼啸";
<<<<<<< HEAD
  } else {
    description = ">9级 超级强风";
  }
  return description;
}

// 天气状况 --> 自然语言描述
// icon来源：https://dribbble.com/kel
function mapSkycon(skycon) {
  const map = {
    "CLEAR_DAY": ["☀️ 日间晴朗", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLEAR_DAY.gif"],
    "CLEAR_NIGHT": ["✨ 夜间晴朗", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLEAR_NIGHT.gif"],
    "PARTLY_CLOUDY_DAY": ["⛅️ 日间多云", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/PARTLY_CLOUDY_DAY.gif"],
    "PARTLY_CLOUDY_NIGHT": ["☁️ 夜间多云", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/PARTLY_CLOUDY_NIGHT.gif"],
    "CLOUDY": ["☁️ 阴", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLOUDY.gif"],
    "LIGHT_HAZE": ["😤 轻度雾霾", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif"],
    "MODERATE_HAZE": ["😤 中度雾霾", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif"],
    "HEAVY_HAZE": ["😤 重度雾霾", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif"],
    "LIGHT_RAIN": ["💧 小雨", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/LIGHT.gif"],
    "MODERATE_RAIN": ["💦 中雨", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/MODERATE_RAIN.gif"],
    "HEAVY_RAIN": ["🌧 大雨", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/STORM_RAIN.gif"],
    "STORM_RAIN": ["⛈ 暴雨", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/STORM_RAIN.gif"],
    "LIGHT_SNOW": ["🌨 小雪", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/LIGHT_SNOW.gif"],
    "MODERATE_SNOW": ["❄️ 中雪", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/MODERATE_SNOW.gif"],
    "HEAVY_SNOW": ["☃️ 大雪", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HEAVY_SNOW.gif"],
    "STORM_SNOW": ["⛄️暴雪", "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HEAVY_SNOW"],
    "DUST": ["💨 浮尘"],
    "SAND": ["💨 沙尘"],
    "WIND": ["🌪 大风"]
  }
=======
  } else if (speed <= 102) {
    description = "10级 暴风毁树";
  } else if (speed <= 117) {
    description = "11级 暴风毁树";
  } else if (speed <= 133) {
    description = "12级 飓风";
  } else if (speed <= 149) {
    description = "13级 台风";
  } else if (speed <= 166) {
    description = "14级 强台风";
  } else if (speed <= 183) {
    description = "15级 强台风";
  } else if (speed <= 201) {
    description = "16级 超强台风";
  } else if (speed <= 220) {
    description = "17级 超强台风";
  }

  if (direction >= 348.76 || direction <= 11.25) {
    d_description = "北";
  } else if (direction >= 11.26 && direction <= 33.75) {
    d_description = "北东北";
  } else if (direction >= 33.76 && direction <= 56.25) {
    d_description = "东北";
  } else if (direction >= 56.26 && direction <= 78.75) {
    d_description = "东东北";
  } else if (direction >= 78.76 && direction <= 101.25) {
    d_description = "东";
  } else if (direction >= 101.26 && direction <= 123.75) {
    d_description = "东东南";
  } else if (direction >= 123.76 && direction <= 146.25) {
    d_description = "东南";
  } else if (direction >= 146.26 && direction <= 168.75) {
    d_description = "南东南";
  } else if (direction >= 168.76 && direction <= 191.25) {
    d_description = "南";
  } else if (direction >= 191.26 && direction <= 213.75) {
    d_description = "南西南";
  } else if (direction >= 213.76 && direction <= 236.25) {
    d_description = "西南";
  } else if (direction >= 236.26 && direction <= 258.75) {
    d_description = "西西南";
  } else if (direction >= 258.76 && direction <= 281.25) {
    d_description = "西";
  } else if (direction >= 281.26 && direction <= 303.75) {
    d_description = "西西北";
  } else if (direction >= 303.76 && direction <= 326.25) {
    d_description = "西北";
  } else if (direction >= 326.26 && direction <= 348.75) {
    d_description = "北西北";
  }

  return `${d_description}风 ${description}`;
}

// 天气状况 --> 自然语言描述
// icon来源：github@58xinian
function mapSkycon(skycon) {
  const map = {
    CLEAR_DAY: [
      "☀️ 日间晴朗",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLEAR_DAY.gif",
    ],
    CLEAR_NIGHT: [
      "✨ 夜间晴朗",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLEAR_NIGHT.gif",
    ],
    PARTLY_CLOUDY_DAY: [
      "⛅️ 日间多云",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/PARTLY_CLOUDY_DAY.gif",
    ],
    PARTLY_CLOUDY_NIGHT: [
      "☁️ 夜间多云",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/PARTLY_CLOUDY_NIGHT.gif",
    ],
    CLOUDY: [
      "☁️ 阴",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLOUDY.gif",
    ],
    LIGHT_HAZE: [
      "😤 轻度雾霾",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif",
    ],
    MODERATE_HAZE: [
      "😤 中度雾霾",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif",
    ],
    HEAVY_HAZE: [
      "😤 重度雾霾",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif",
    ],
    LIGHT_RAIN: [
      "💧 小雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/LIGHT.gif",
    ],
    MODERATE_RAIN: [
      "💦 中雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/MODERATE_RAIN.gif",
    ],
    HEAVY_RAIN: [
      "🌧 大雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/STORM_RAIN.gif",
    ],
    STORM_RAIN: [
      "⛈ 暴雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/STORM_RAIN.gif",
    ],
    LIGHT_SNOW: [
      "🌨 小雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/LIGHT_SNOW.gif",
    ],
    MODERATE_SNOW: [
      "❄️ 中雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/MODERATE_SNOW.gif",
    ],
    HEAVY_SNOW: [
      "☃️ 大雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HEAVY_SNOW.gif",
    ],
    STORM_SNOW: [
      "⛄️暴雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HEAVY_SNOW",
    ],
    DUST: ["💨 浮尘"],
    SAND: ["💨 沙尘"],
    WIND: ["🌪 大风"],
  };
>>>>>>> upstream/master
  return map[skycon];
}

// 雷达降 水/雪 强度 --> skycon
function mapPrecipitation(intensity) {
  if (0.031 < intensity && intensity < 0.25) {
    return "LIGHT";
  } else if (intensity < 0.35) {
    return "MODERATE";
  } else if (intensity < 0.48) {
    return "HEADY";
  } else if (intensity >= 0.48) {
    return "STORM";
  }
}

function mapIntensity(breakpoints) {}

/************************** ERROR *********************************/
function MYERR() {
  class TokenError extends Error {
    constructor(message) {
      super(message);
      this.name = "TokenError";
    }
  }

  return {
    TokenError,
  };
}

// prettier-ignore
/*********************************** API *************************************/
function API(s="untitled",t=!1){return new class{constructor(s,t){this.name=s,this.debug=t,this.isQX="undefined"!=typeof $task,this.isLoon="undefined"!=typeof $loon,this.isSurge="undefined"!=typeof $httpClient&&!this.isLoon,this.isNode="function"==typeof require,this.isJSBox=this.isNode&&"undefined"!=typeof $jsbox,this.node=(()=>{if(this.isNode){const s="undefined"!=typeof $request?void 0:require("request"),t=require("fs");return{request:s,fs:t}}return null})(),this.initCache();const e=(s,t)=>new Promise(function(e){setTimeout(e.bind(null,t),s)});Promise.prototype.delay=function(s){return this.then(function(t){return e(s,t)})}}get(s){return this.isQX?("string"==typeof s&&(s={url:s,method:"GET"}),$task.fetch(s)):new Promise((t,e)=>{this.isLoon||this.isSurge?$httpClient.get(s,(s,i,o)=>{s?e(s):t({status:i.status,headers:i.headers,body:o})}):this.node.request(s,(s,i,o)=>{s?e(s):t({...i,status:i.statusCode,body:o})})})}post(s){return this.isQX?("string"==typeof s&&(s={url:s}),s.method="POST",$task.fetch(s)):new Promise((t,e)=>{this.isLoon||this.isSurge?$httpClient.post(s,(s,i,o)=>{s?e(s):t({status:i.status,headers:i.headers,body:o})}):this.node.request.post(s,(s,i,o)=>{s?e(s):t({...i,status:i.statusCode,body:o})})})}initCache(){if(this.isQX&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(this.isLoon||this.isSurge)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),this.isNode){let s="root.json";this.node.fs.existsSync(s)||this.node.fs.writeFileSync(s,JSON.stringify({}),{flag:"wx"},s=>console.log(s)),this.root={},s=`${this.name}.json`,this.node.fs.existsSync(s)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(s,JSON.stringify({}),{flag:"wx"},s=>console.log(s)),this.cache={})}}persistCache(){const s=JSON.stringify(this.cache);this.isQX&&$prefs.setValueForKey(s,this.name),(this.isLoon||this.isSurge)&&$persistentStore.write(s,this.name),this.isNode&&(this.node.fs.writeFileSync(`${this.name}.json`,s,{flag:"w"},s=>console.log(s)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root),{flag:"w"},s=>console.log(s)))}write(s,t){this.log(`SET ${t}`),-1!==t.indexOf("#")?(t=t.substr(1),this.isSurge&this.isLoon&&$persistentStore.write(s,t),this.isQX&&$prefs.setValueForKey(s,t),this.isNode&&(this.root[t]=s)):this.cache[t]=s,this.persistCache()}read(s){return this.log(`READ ${s}`),-1===s.indexOf("#")?this.cache[s]:(s=s.substr(1),this.isSurge&this.isLoon?$persistentStore.read(s):this.isQX?$prefs.valueForKey(s):this.isNode?this.root[s]:void 0)}delete(s){this.log(`DELETE ${s}`),delete this.cache[s],-1!==s.indexOf("#")?(s=s.substr(1),this.isSurge&this.isLoon&&$persistentStore.write(null,s),this.isQX&&$prefs.setValueForKey(null,s),this.isNode&&delete this.root[s]):this.cache[s]=data,this.persistCache()}notify(s,t="",e="",i={}){const o=i["open-url"],n=i["media-url"],r=e+(o?`\n点击跳转: ${o}`:"")+(n?`\n多媒体: ${n}`:"");if(this.isQX&&$notify(s,t,e,i),this.isSurge&&$notification.post(s,t,r),this.isLoon&&$notification.post(s,t,e,o),this.isNode)if(this.isJSBox){const e=require("push");e.schedule({title:s,body:(t?t+"\n":"")+r})}else console.log(`${s}\n${t}\n${r}\n\n`)}log(s){this.debug&&console.log(s)}info(s){console.log(s)}error(s){console.log("ERROR: "+s)}wait(s){return new Promise(t=>setTimeout(t,s))}done(s={}){this.isQX||this.isLoon||this.isSurge?$done(s):this.isNode&&!this.isJSBox&&"undefined"!=typeof $context&&($context.headers=s.headers,$context.statusCode=s.statusCode,$context.body=s.body)}}(s,t)}
/*****************************************************************************/
