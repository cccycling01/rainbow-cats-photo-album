// miniprogram/pages/Anniversary/index.js
const app = getApp()

Page({
  data: {
    anniversaries: [],
    nextAnniversary: null,
    daysRemaining: 0,
    loading: true
  },

  onLoad() {},

  onShow() {
    this.loadAnniversaries()
  },

  async loadAnniversaries() {
    this.setData({ loading: true })

    try {
      const db = wx.cloud.database()
      const openidA = app.globalData._openidA
      const openidB = app.globalData._openidB

      // 获取所有纪念日
      const result = await db.collection('AnniversaryList')
        .where(db.command.or(
          { _openid: openidA },
          { _openid: openidB }
        ))
        .orderBy('date', 'asc')
        .get()

      const anniversaries = result.data || []

      // 计算每个纪念日的倒计时
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let nextAnniversary = null
      let minDays = 9999

      anniversaries.forEach(item => {
        const anniversary = this.calculateDaysRemaining(item.date, item.isLunar)
        item.daysRemaining = anniversary.days
        item.isToday = anniversary.isToday
        item.isPast = anniversary.isPast
        item.nextDate = anniversary.nextDate

        // 找出最近的纪念日
        if (!anniversary.isPast && anniversary.days < minDays) {
          minDays = anniversary.days
          nextAnniversary = item
        }
      })

      // 如果都过了，找下一个
      if (!nextAnniversary && anniversaries.length > 0) {
        nextAnniversary = anniversaries[0]
        const anniversary = this.calculateDaysRemaining(nextAnniversary.date, nextAnniversary.isLunar)
        nextAnniversary.daysRemaining = anniversary.days
      }

      this.setData({
        anniversaries,
        nextAnniversary,
        daysRemaining: nextAnniversary ? nextAnniversary.daysRemaining : 0,
        loading: false
      })

    } catch (err) {
      console.error('加载纪念日失败:', err)
      this.setData({ loading: false })
    }
  },

  calculateDaysRemaining(dateStr, isLunar) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let anniversaryDate = new Date(dateStr)
    const thisYear = today.getFullYear()

    if (isLunar) {
      // 简化处理：农历纪念日按公历计算
      // 实际需要使用农历转换库
    }

    // 设置为今年的纪念日
    anniversaryDate.setFullYear(thisYear)

    // 如果已过，计算到明年
    if (anniversaryDate < today) {
      anniversaryDate.setFullYear(thisYear + 1)
    }

    const diffTime = anniversaryDate - today
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const isToday = days === 0
    const isPast = days > 366 // 超过一年也算过

    return {
      days: days,
      isToday: isToday,
      isPast: isPast,
      nextDate: anniversaryDate
    }
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/AnniversaryAdd/index'
    })
  },

  async deleteAnniversary(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个纪念日吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database()
            await db.collection('AnniversaryList').doc(id).remove()

            wx.showToast({
              title: '已删除',
              icon: 'success'
            })

            this.loadAnniversaries()
          } catch (err) {
            console.error('删除失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  getTypeIcon(type) {
    const icons = {
      'birthday': '🎂',
      'love': '💕',
      'custom': '🎉'
    }
    return icons[type] || '🎉'
  },

  onPullDownRefresh() {
    this.loadAnniversaries().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
