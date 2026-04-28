# 每日事项打卡微信小程序

一个可直接导入微信开发者工具的「每日事项打卡」小程序示例，支持：

- 新增每日事项
- 勾选/取消当天打卡
- 删除事项
- 本地持久化（`wx.setStorageSync`）
- 微信云开发存储（可选）
- 连续打卡天数统计（当天全部事项完成时累计）

## 目录结构

```text
miniapp-daily-checkin/
├── app.js
├── app.json
├── app.wxss
├── sitemap.json
├── utils/
│   └── date.js
└── pages/
    └── index/
        ├── index.js
        ├── index.wxml
        └── index.wxss
```

## 使用方法

1. 打开微信开发者工具。
2. 选择「导入项目」。
3. 项目目录选择 `miniapp-daily-checkin`。
4. AppID 可以先用测试号。
5. 编译后即可体验。

## 如何启用微信云开发

默认是本地模式（`useCloud: false`）。如果你想使用微信云开发：

1. 在微信开发者工具中开通云开发并创建环境。
2. 修改 `app.js` 中配置：
   - `useCloud: true`
   - `cloudEnvId: '你的云环境ID'`
   - `cloudCollection: 'daily_checkin_profiles'`（可自定义）
3. 在云数据库中新建对应集合（首次运行也可自动创建文档）。
4. 重新编译后，数据会走云数据库读写。

> 说明：当前示例为了简单，默认只维护当前用户第一条文档。后续建议按 `_openid` 做一人一档。

## 后续可扩展

- 按 `_openid` 分用户存储和查询
- 事项分类（学习、运动、习惯）
- 月度打卡日历
- 打卡提醒订阅消息
