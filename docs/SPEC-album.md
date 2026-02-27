# 共享相册功能规格说明书

## 1. 功能概述

### 1.1 功能名称
**共享相册** - 情侣双方共享照片的相册功能

### 1.2 功能描述
允许情侣双方上传照片到共享相册，双方都可以浏览、评论、点赞照片，支持设置相册封面。

### 1.3 优先级
P0 (最高优先级)

---

## 2. 验收标准

### 2.1 核心功能
- [ ] 用户可以上传照片到共享相册
- [ ] 照片按上传时间倒序显示
- [ ] 双方都可以浏览相册
- [ ] 可以对照片进行评论
- [ ] 可以对照片进行点赞
- [ ] 可以设置相册封面
- [ ] 可以删除自己上传的照片

### 2.2 交互体验
- [ ] 上传进度清晰显示
- [ ] 照片加载使用懒加载
- [ ] 点赞/取消点赞有动画反馈
- [ ] 评论发送有成功提示

### 2.3 边界情况
- [ ] 无照片时显示空状态
- [ ] 上传失败有错误提示
- [ ] 网络断开有提示
- [ ] 照片加载失败显示占位图

---

## 3. 页面结构

### 3.1 新增页面

| 页面 | 路径 | 描述 |
|------|------|------|
| 相册主页 | `/pages/Album/index` | 显示相册网格，封面 |
| 照片详情 | `/pages/AlbumDetail/index` | 照片大图，评论，点赞 |
| 上传照片 | `/pages/AlbumUpload/index` | 选择并上传照片 |

### 3.2 页面流程

```
MainPage (主页)
    ↓ 点击"相册"按钮
Album (相册主页)
    ├── 点击照片 → AlbumDetail (详情)
    │       ├── 点赞 → 动画反馈
    │       ├── 评论 → 发送评论
    │       └── 删除 → 确认弹窗 → 删除
    │
    └── 点击"+" → AlbumUpload (上传)
            ├── 选择照片
            └── 确认上传
```

---

## 4. 数据库设计

### 4.1 相册集合: `AlbumList`

```json
{
  "_id": "auto-generated",
  "_openid": "user-openid",
  "uploader": "卡比",           // 上传者名字
  "uploaderId": "A",            // A 或 B
  "imageUrl": "cloud://xxx",    // 云存储图片URL
  "thumbUrl": "cloud://xxx",    // 缩略图URL
  "content": "照片描述",         // 可选的文字描述
  "likes": ["openid1", "openid2"],  // 点赞用户openid数组
  "likeCount": 0,               // 点赞数
  "commentCount": 0,           // 评论数
  "isCover": false,             // 是否为封面
  "createTime": "2026-02-27T12:00:00.000Z"
}
```

### 4.2 评论集合: `AlbumComments`

```json
{
  "_id": "auto-generated",
  "albumId": "album-record-id",  // 关联的照片ID
  "_openid": "user-openid",
  "commenter": "卡比",           // 评论者名字
  "commenterId": "A",           // A 或 B
  "content": "评论内容",
  "createTime": "2026-02-27T12:00:00.000Z"
}
```

### 4.3 相册设置集合: `AlbumSettings`

```json
{
  "_id": "auto-generated",
  "_openid": "user-openid",
  "coverId": "album-record-id",  // 封面照片ID
  "updateTime": "2026-02-27T12:00:00.000Z"
}
```

---

## 5. 云函数设计

### 5.1 getAlbumList
获取相册列表

**参数:**
```json
{
  "page": 1,
  "pageSize": 20
}
```

**返回:**
```json
{
  "list": [...],
  "total": 100,
  "cover": {...}
}
```

### 5.2 uploadAlbumPhoto
上传照片到云存储并创建记录

**参数:**
```json
{
  "filePath": "temp-file-path",
  "content": "可选描述"
}
```

**返回:**
```json
{
  "success": true,
  "albumId": "new-record-id"
}
```

### 5.3 likePhoto
点赞/取消点赞

**参数:**
```json
{
  "albumId": "album-record-id"
}
```

**返回:**
```json
{
  "success": true,
  "liked": true,
  "likeCount": 5
}
```

### 5.4 addComment
添加评论

**参数:**
```json
{
  "albumId": "album-record-id",
  "content": "评论内容"
}
```

**返回:**
```json
{
  "success": true,
  "commentId": "new-comment-id"
}
```

### 5.5 deletePhoto
删除照片（仅上传者可删除）

**参数:**
```json
{
  "albumId": "album-record-id"
}
```

**返回:**
```json
{
  "success": true
}
```

### 5.6 setCover
设置封面

**参数:**
```json
{
  "albumId": "album-record-id"
}
```

**返回:**
```json
{
  "success": true
}
```

---

## 6. UI/UX 设计要求

### 6.1 设计风格
- 遵循 Apple 浅色主题
- 圆角卡片设计
- 柔和阴影效果
- 响应式网格布局

### 6.2 色彩方案
```css
--primary: #007AFF;      /* 主色 */
--bg-primary: #F5F5F7;   /* 主背景 */
--bg-card: #FFFFFF;      /* 卡片背景 */
--text-primary: #1D1D1F; /* 主文字 */
--text-secondary: #86868B; /* 次要文字 */
--accent-pink: #FF2D55;  /* 点赞心形 */
--border: #E5E5E5;       /* 边框 */
```

### 6.3 布局规范

**相册主页:**
- 顶部封面图 (16:9 比例)
- 网格显示照片 (3列)
- 照片间距: 4rpx
- 右下角悬浮上传按钮

**照片详情:**
- 全屏大图显示
- 底部显示: 描述、点赞数、评论数
- 点击评论展开评论列表

### 6.4 动画效果
- 点赞: 心形放大动画 (scale 1 → 1.3 → 1)
- 上传: 进度条平滑动画
- 页面切换: 左滑/右滑动画

---

## 7. 安全考虑

### 7.1 数据权限
- 照片仅情侣双方可见
- 删除仅上传者可操作
- 评论需验证身份

### 7.2 内容安全
- 图片需通过微信内容安全检测
- 评论需通过文本内容安全检测

### 7.3 存储安全
- 云存储设置权限为仅情侣可见
- 定期清理不必要的图片

---

## 8. 性能优化

### 8.1 图片优化
- 上传时生成缩略图
- 列表使用缩略图
- 详情页加载原图
- 懒加载优化

### 8.2 接口优化
- 分页加载
- 数据缓存
- 增量更新

---

## 9. 涉及文件清单

### 9.1 新增文件
```
miniprogram/pages/Album/
├── index.js
├── index.json
├── index.wxml
├── index.wxss

miniprogram/pages/AlbumDetail/
├── index.js
├── index.json
├── index.wxml
├── index.wxss

miniprogram/pages/AlbumUpload/
├── index.js
├── index.json
├── index.wxml
├── index.wxss
```

### 9.2 修改文件
```
miniprogram/app.json      # 添加新页面路由
miniprogram/app.js        # 添加新集合名称
cloudfunctions/           # 新增云函数
```

### 9.3 新增云函数
```
cloudfunctions/getAlbumList/
cloudfunctions/uploadAlbumPhoto/
cloudfunctions/likePhoto/
cloudfunctions/addComment/
cloudfunctions/deletePhoto/
cloudfunctions/setCover/
```

---

## 10. 测试用例

### 10.1 功能测试
- [ ] 上传单张照片成功
- [ ] 上传多张照片成功
- [ ] 照片列表正确显示
- [ ] 点赞功能正常
- [ ] 取消点赞正常
- [ ] 评论发送成功
- [ ] 删除自己照片成功
- [ ] 删除他人照片失败

### 10.2 边界测试
- [ ] 无照片显示空状态
- [ ] 网络超时显示错误
- [ ] 图片加载失败显示占位图

---

**创建日期:** 2026-02-27
**版本:** 1.0
**状态:** 待开发
