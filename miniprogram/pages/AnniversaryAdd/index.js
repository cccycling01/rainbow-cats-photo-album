// miniprogram/pages/AnniversaryAdd/index.js
const app = getApp()

Page({
  data: {
    name: '',
    date: '',
    type: 'love',
    isLunar: false,
    types: [
      { id: 'love', name: '💕 纪念日', icon: '💕' },
      { id: 'birthday', name: '🎂 生日', icon: '🎂' },
      { id: 'custom', name: '🎉 自定义', icon: '🎉' }
    ]
  },

  onLoad() {},

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onTypeChange(e) {
    const { types } = this.data
    const type = types[e.detail.value].id
    this.setData({ type })
  },

  onLunarChange(e) {
    this.setData({ isLunar: e.detail.value })
  },

  async save() {
    const { name, date, type, isLunar } = this.data

    if (!name.trim()) {
      wx.showToast({
        title: '请输入名称',
        icon: 'none'
      })
      return
    }

    if (!date) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const db = wx.cloud.database()

      await db.collection('AnniversaryList').add({
        data: {
          _openid: app.globalData._openidA || app.globalData._openidB,
          name: name.trim(),
          date: date,
          type: type,
          isLunar: isLunar,
          createTime: db.serverDate()
        }
      })

      wx.showToast({
        title: '已保存',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (err) {
      console.error('保存失败:', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
})
