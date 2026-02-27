// miniprogram/pages/CheckIn/index.js
const app = getApp()

Page({
  data: {
    todayChecked: false,
    checkIns: [],
    streak: 0,
    presets: [
      { id: 1, icon: '🌅', name: '早起', exp: 10 },
      { id: 2, icon: '🏃', name: '运动', exp: 15 },
      { id: 3, icon: '📚', name: '阅读', exp: 10 },
      { id: 4, icon: '💤', name: '早睡', exp: 10 },
      { id: 5, icon: '💧', name: '喝水', exp: 5 },
      { id: 6, icon: '🍎', name: '吃早餐', exp: 10 }
    ]
  },

  onLoad() { this.loadCheckIns() },
  onShow() { this.loadCheckIns() },

  async loadCheckIns() {
    try {
      const db = wx.cloud.database()
      const openid = app.globalData._openidA || app.globalData._openidB
      const today = new Date().toDateString()
      
      const result = await db.collection('CheckIns')
        .where({ _openid: openid })
        .orderBy('date', 'desc')
        .get()
      
      const checkIns = result.data || []
      const todayChecked = checkIns.length > 0 && new Date(checkIns[0].date).toDateString() === today
      const streak = this.calculateStreak(checkIns)
      
      this.setData({ checkIns: checkIns.slice(0, 7), todayChecked, streak })
    } catch (err) { console.error(err) }
  },

  calculateStreak(checkIns) {
    if (checkIns.length === 0) return 0
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const hasCheck = checkIns.some(c => new Date(c.date).toDateString() === date.toDateString())
      if (hasCheck) streak++
      else if (i > 0) break
    }
    return streak
  },

  async doCheckIn(e) {
    const { id } = e.currentTarget.dataset
    const preset = this.data.presets.find(p => p.id === id)
    if (this.data.todayChecked) {
      wx.showToast({ title: '今天已打卡', icon: 'none' })
      return
    }
    
    try {
      const db = wx.cloud.database()
      await db.collection('CheckIns').add({
        data: {
          _openid: app.globalData._openidA || app.globalData._openidB,
          preset: preset,
          date: db.serverDate()
        }
      })
      wx.showToast({ title: '打卡成功! +' + preset.exp + '经验', icon: 'success' })
      this.loadCheckIns()
    } catch (err) {
      wx.showToast({ title: '打卡失败', icon: 'none' })
    }
  }
})
