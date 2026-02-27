// miniprogram/pages/Intimacy/index.js
const app = getApp()

Page({
  data: {
    level: 1,
    exp: 0,
    maxExp: 100,
    title: '初识',
    badges: [],
    activities: []
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    try {
      const db = wx.cloud.database()
      const openid = app.globalData._openidA || app.globalData._openidB
      
      const result = await db.collection('IntimacyData').where({ _openid: openid }).get()
      if (result.data.length > 0) {
        const data = result.data[0]
        const level = data.level || 1
        const exp = data.exp || 0
        const maxExp = level * 100
        const titles = ['初识', '好感', '喜欢', '爱恋', '热恋', '真爱', '灵魂伴侣']
        const title = titles[Math.min(level - 1, titles.length - 1)]
        
        this.setData({ level, exp, maxExp, title, badges: data.badges || [], activities: data.activities || [] })
      }
    } catch (err) { console.error(err) }
  },

  getLevelInfo() {
    const { level, exp, maxExp, title } = this.data
    const progress = Math.round((exp / maxExp) * 100)
    return { level, exp, maxExp, title, progress }
  }
})
