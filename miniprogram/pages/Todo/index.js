// miniprogram/pages/Todo/index.js
const app = getApp()

Page({
  data: {
    todos: [],
    newTodo: '',
    loading: true,
    progress: 0,
    completedCount: 0,
    totalCount: 0
  },

  onLoad() {},
  onShow() { this.loadTodos() },

  async loadTodos() {
    this.setData({ loading: true })
    try {
      const db = wx.cloud.database()
      const openidA = app.globalData._openidA
      const openidB = app.globalData._openidB
      
      const result = await db.collection('TodoList')
        .where(db.command.or({ _openid: openidA }, { _openid: openidB }))
        .orderBy('createTime', 'desc')
        .get()
      
      const todos = result.data || []
      const completedCount = todos.filter(t => t.completed).length
      const totalCount = todos.length
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      
      this.setData({ todos, completedCount, totalCount, progress, loading: false })
    } catch (err) {
      console.error('加载失败:', err)
      this.setData({ loading: false })
    }
  },

  onInput(e) { this.setData({ newTodo: e.detail.value }) },

  async addTodo() {
    const { newTodo } = this.data
    if (!newTodo.trim()) return
    
    try {
      const db = wx.cloud.database()
      await db.collection('TodoList').add({
        data: {
          _openid: app.globalData._openidA || app.globalData._openidB,
          creator: app.globalData.userA || app.globalData.userB,
          content: newTodo.trim(),
          completed: false,
          completedBy: null,
          completedTime: null,
          createTime: db.serverDate()
        }
      })
      this.setData({ newTodo: '' })
      this.loadTodos()
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  async toggleTodo(e) {
    const { id, completed } = e.currentTarget.dataset
    const db = wx.cloud.database()
    const openid = app.globalData._openidA || app.globalData._openidB
    const userName = openid === app.globalData._openidA ? app.globalData.userA : app.globalData.userB
    
    try {
      await db.collection('TodoList').doc(id).update({
        data: {
          completed: !completed,
          completedBy: !completed ? userName : null,
          completedTime: !completed ? db.serverDate() : null
        }
      })
      this.loadTodos()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  async deleteTodo(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个待办吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.database().collection('TodoList').doc(id).remove()
            this.loadTodos()
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
