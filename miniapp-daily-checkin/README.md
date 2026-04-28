# 每日事项打卡微信小程序

一个可直接导入微信开发者工具的「每日事项打卡」小程序示例，现已支持你要求的“全都要”版本：

- 新增每日事项
- 勾选/取消当天打卡
- 删除事项
- 连续打卡统计
- 月度打卡日历 + 完成率
- 订阅消息提醒（授权入口）
- 本地持久化 + 云开发持久化（可自动回退）
- 云函数后端（含基础参数校验）
- 按 `_openid` 一人一档

## 一键导入微信开发者工具

### 方式 A（Windows 一键）

1. 打开 `cmd`，进入项目目录：
   ```bat
   cd miniapp-daily-checkin
   ```
2. 直接执行：
   ```bat
   open-in-devtools.bat
   ```

默认会尝试这个 CLI 路径：

```text
C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat
```

如果你的路径不同，可传入参数：

```bat
open-in-devtools.bat "D:\wechat-devtools\cli.bat"
```

### 方式 B（macOS 一键）

> 适用于 macOS，且你已安装微信开发者工具。

1. 打开终端进入项目目录：
   ```bash
   cd miniapp-daily-checkin
   ```
2. 执行脚本：
   ```bash
   ./open-in-devtools.sh
   ```

如果 CLI 路径不是默认值，可手动传参：

```bash
./open-in-devtools.sh /Applications/wechatwebdevtools.app/Contents/MacOS/cli
```

### 方式 C（手动导入）

1. 打开微信开发者工具。
2. 选择「导入项目」。
3. 选择目录：`miniapp-daily-checkin`。
4. AppID 可先使用测试号，后续改成你自己的小程序 AppID。

> 已提供 `project.config.json`（含 `miniprogramRoot` 和 `cloudfunctionRoot`），导入后会自动识别小程序与云函数目录。

## 目录结构

```text
miniapp-daily-checkin/
├── app.js
├── app.json
├── app.wxss
├── project.config.json
├── open-in-devtools.sh
├── open-in-devtools.bat
├── sitemap.json
├── utils/
│   └── date.js
├── cloudfunctions/
│   ├── login/
│   │   ├── index.js
│   │   └── package.json
│   └── profile/
│       ├── index.js
│       └── package.json
└── pages/
    └── index/
        ├── index.js
        ├── index.wxml
        └── index.wxss
```

## 云开发配置说明

### 1）`app.js`

- `useCloud: true`：启用云开发模式
- `cloudEnvId`：你的云环境 ID
- `functionNames.login/profile`：云函数名
- `templateIds`：订阅消息模板 ID 列表

### 2）云数据库

- 集合名：`daily_checkin_profiles`
- 文档结构（示例）：

```json
{
  "tasks": [{ "id": 1, "title": "阅读", "lastCheckinDate": "2026-04-28" }],
  "streak": 5,
  "lastCheckinDate": "2026-04-28",
  "checkinHistory": ["2026-04-26", "2026-04-27", "2026-04-28"],
  "reminder": { "enabled": true, "time": "21:00" },
  "_openid": "用户openid"
}
```

## 说明

- 云端数据通过 `profile` 云函数读写，避免前端直接信任写入。
- `profile` 云函数包含基础 payload 校验（任务数组、streak、提醒字段等）。
- 页面会展示当前 `openid`，方便调试确认“按人分档”是否生效。

## 后续建议

- 增加 remindTime 选择器并落库。
- 通过云函数定时触发器发起提醒（可配合服务通知链路）。
- 增加年度热力图与任务分类统计。
