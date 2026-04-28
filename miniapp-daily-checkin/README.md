# 每日事项打卡微信小程序

一个可直接导入微信开发者工具的「每日事项打卡」小程序示例，支持：

- 新增每日事项
- 勾选/取消当天打卡
- 删除事项
- 本地持久化（`wx.setStorageSync`）
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

## 后续可扩展

- 事项分类（学习、运动、习惯）
- 数据同步到云开发数据库
- 月度打卡日历
- 打卡提醒订阅消息
