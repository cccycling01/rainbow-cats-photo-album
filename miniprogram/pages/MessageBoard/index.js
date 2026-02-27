// miniprogram/pages/MessageBoard/index.js
const app = getApp()

Page({
  data: {
    messages: [],
    newMessage: '',
    isWhisper: false,
    loading: true,
    currentUserOpenid: '',
    currentUserName: '',
    currentUserId: '',
    partnerOpenid: '',
    partnerName: '',
    inputBottom: 0
  },

  onLoad() {
    this.initUserInfo()
    this.loadMessages()
  },

  onShow() {
    this.loadMessages()
  },

  initUserInfo() {
    const openidA = app.globalData._openidA
    const openidB = app.globalData._openidB
    const userA = app.globalData.userA
    const userB = app.globalData.userB

    // 获取当前用户（这里简化处理，实际应根据登录情况）
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const openid = res.result.openid
      const isUserA = openid === openidA

      this.setData({
        currentUserOpenid: openid,
        currentUserName: isUserA ? userA : userB,
        currentUserId: isUserA ? 'A' : 'B',
        partnerOpenid: isUserA ? openidB : openidA,
        partnerName: isUserA ? userB : userA
      })
    }).catch(() => {
      // 降级处理：使用配置的默认用户
      this.setData({
        currentUserOpenid: openidA,
        currentUserName: userA,
        currentUserId: 'A',
        partnerOpenid: openidB,
        partnerName: userB
      })
    })
  },

  async loadMessages() {
    this.setData({ loading: true })

    try {
      const db = wx.cloud.database()
      
      // 获取当前用户和伴侣的所有消息
      const openidA = app.globalData._openidA
      const openidB = app.globalData._openidB

      const result = await db.collection('MessageList')
        .where(db.command.or(
          { _openid: openidA },
          { _openid: openidB }
        ))
        .orderBy('createTime', 'desc')
        .limit(100)
        .get()

      // 处理悄悄话 - 只显示自己发送的或已读的
      const currentOpenid = this.data.currentUserOpenid
      const messages = result.data.filter(msg => {
        if (msg.type === 'whisper') {
          // 悄悄话：只显示自己发送的 或 已读的
          return msg._openid === currentOpenid || msg.isRead
        }
        return true
      })

      // 格式化时间
      messages.forEach(msg => {
        msg.timeStr = this.formatTime(msg.createTime)
      })

      // 更新已读状态
      await this.markAsRead()

      this.setData({
        messages,
        loading: false
      })
    } catch (err) {
      console.error('加载消息失败:', err)
      this.setData({ loading: false })
    }
  },

  async markAsRead() {
    try {
      const db = wx.cloud.database()
      const openidA = app.globalData._openidA

      // 将对方发送的未读消息标记为已读
      await db.collection('MessageList')
        .where({
          _openid: openidA === this.data.currentUserOpenid ? app.globalData._openidB : app.globalData._openidA,
          isRead: false
        })
        .update({
          data: { isRead: true }
        })
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    if (isToday) {
      return `${hour}:${minute}`
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  },

  onMessageInput(e) {
    this.setData({ newMessage: e.detail.value })
  },

  toggleWhisper() {
    this.setData({ isWhisper: !this.data.isWhisper })
  },

  async sendMessage() {
    const { newMessage, isWhisper, currentUserOpenid, currentUserName, currentUserId, partnerOpenid, partnerName } = this.data

    if (!newMessage.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '发送中...' })

    try {
      const db = wx.cloud.database()

      await db.collection('MessageList').add({
        data: {
          _openid: currentUserOpenid,
          sender: currentUserName,
          senderId: currentUserId,
          receiver: partnerName,
          receiverId: currentUserId === 'A' ? 'B' : 'A',
          content: newMessage.trim(),
          type: isWhisper ? 'whisper' : 'normal',
          isRead: false,
          createTime: db.serverDate()
        }
      })

      wx.showToast({
        title: '已发送',
        icon: 'success'
      })

      this.setData({ newMessage: '', isWhisper: false })
      this.loadMessages()

      // 如果是悄悄话，1秒后刷新（悄悄话会消失）
      if (isWhisper) {
        setTimeout(() => {
          this.loadMessages()
        }, 1500)
      }

    } catch (err) {
      console.error('发送失败:', err)
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  onWhisperTap(e) {
    const { index } = e.currentTarget.dataset
    const messages = this.data.messages
    const msg = messages[index]

    // 如果是未读的悄悄话，点击后删除（模拟阅读后消失）
    if (msg.type === 'whisper' && !msg.isRead && msg._openid !== this.data.currentUserOpenid) {
      // 标记为已读
      const db = wx.cloud.database()
      db.collection('MessageList').doc(msg._id).update({
        data: { isRead: true }
      })
      
      // 从列表中移除
      messages.splice(index, 1)
      this.setData({ messages })
    }
  },

  onPullDownRefresh() {
    this.loadMessages().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    // 可以添加上拉加载更多
  },

  onInputFocus(e) {
    this.setData({ inputBottom: e.detail.height })
  },

  onInputBlur() {
    this.setData({ inputBottom: 0 })
  }
})
