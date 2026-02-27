# 共同待办功能规格说明书

## 1. 功能概述

### 1.1 功能名称
**共同待办** - 情侣一起完成的待办事项

### 1.2 功能描述
允许情侣双方添加待办事项，双方都可以标记完成，实时同步进度。

### 1.3 优先级
P2

---

## 2. 验收标准

- [ ] 可以添加待办事项
- [ ] 显示待办列表（按添加时间倒序）
- [ ] 区分已完成/未完成
- [ ] 显示完成者
- [ ] 显示完成进度百分比
- [ ] 删除待办

---

## 3. 数据库设计

### 3.1 待办集合: `TodoList`

```json
{
  "_id": "auto-generated",
  "_openid": "creator-openid",
  "creator": "卡比",
  "content": "待办内容",
  "completed": false,
  "completedBy": null,
  "completedTime": null,
  "createTime": "2026-02-27T12:00:00.000Z"
}
```

---

## 4. 页面结构

```
miniprogram/pages/Todo/
├── index.js        # 待办列表
├── index.wxml
├── index.wxss
└── index.json
```

---

**版本:** 1.0
