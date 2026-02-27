// miniprogram/pages/Stats/index.js
const app = getApp()

Page({
  data: {
    weekStats: { tasks: 0, messages: 0, photos: 0 },
    streak: 0,
    chartData: []
  },

  onLoad() { this.loadStats() },

  async loadStats() {
    // 模拟统计数据
    const weekStats = { tasks: 12, messages: 45, photos: 8 }
    const streak = 7
    const chartData = [
      { day: '周一', value: 5 },
      { day: '周二', value: 8 },
      { day: '周三', value: 3 },
      { day: '周四', value: 6 },
      { day: '周五', value: 9 },
      { day: '周六', value: 12 },
      { day: '周日', value: 7 }
    ]
    this.setData({ weekStats, streak, chartData })
  }
})
