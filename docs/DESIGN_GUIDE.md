# UI/UX 设计改进规范

## 1. 统一色彩方案

```css
--primary: #007AFF;        /* 主色 - 蓝色 */
--primary-gradient: linear-gradient(135deg, #007AFF, #5856D6);
--success: #34C759;       /* 成功 - 绿色 */
--warning: #FF9500;       /* 警告 - 橙色 */
--danger: #FF3B30;        /* 危险 - 红色 */
--pink: #FF2D55;         /* 粉色 - 爱情 */

/* 背景 */
--bg-primary: #F5F5F7;
--bg-card: #FFFFFF;

/* 文字 */
--text-primary: #1D1D1F;
--text-secondary: #86868B;
--text-tertiary: #A1A1A6;
```

## 2. 统一组件规范

### 按钮
```css
.btn-primary {
  background: var(--primary-gradient);
  border-radius: 48rpx;
  height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
}
```

### 卡片
```css
.card {
  background: var(--bg-card);
  border-radius: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
```

### 输入框
```css
.input {
  background: #F5F5F7;
  border-radius: 36rpx;
  padding: 0 24rpx;
  height: 72rpx;
}
```

## 3. 动画规范

### 点击反馈
```css
:active {
  transform: scale(0.95);
  opacity: 0.9;
}
```

### 加载动画
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 渐入动画
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 4. 空状态规范

```html
<view class="empty-state">
  <text class="empty-icon">📭</text>
  <text class="empty-text">暂无内容</text>
  <text class="empty-hint">点击右下角添加</text>
</view>
```

## 5. 错误提示规范

- 使用 `wx.showToast({ icon: 'none' })` 显示简短错误
- 重要错误使用 `wx.showModal`
- 网络错误统一提示"网络不稳定，请稍后重试"

---

## 页面清单需要更新

1. AlbumUpload - 添加文件类型验证
2. AlbumDetail - 调用云函数删除
3. 统一错误处理
