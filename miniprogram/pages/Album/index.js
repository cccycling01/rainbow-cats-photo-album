// miniprogram/pages/Album/index.js
const app = getApp()

Page({
  data: {
    albumList: [],
    coverImage: '',
    loading: true,
    uploading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    userInfo: null,
    isMy: false
  },

  onLoad() {
    this.initUserInfo()
  },

  onShow() {
    this.loadAlbumList(true)
  },

  initUserInfo() {
    const userInfo = app.globalData
    this.setData({ userInfo })
  },

  async loadAlbumList(refresh = false) {
    if (refresh) {
      this.setData({ page: 1, hasMore: true })
    }

    if (!this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const result = await wx.cloud.callFunction({
        name: 'getAlbumList',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      const newList = result.result.list || []
      
      if (refresh) {
        this.setData({
          albumList: newList,
          coverImage: result.result.cover?.imageUrl || ''
        })
      } else {
        this.setData({
          albumList: [...this.data.albumList, ...newList]
        })
      }

      this.setData({
        hasMore: newList.length >= this.data.pageSize,
        page: this.data.page + 1
      })
    } catch (err) {
      console.error('加载相册失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadAlbumList()
    }
  },

  onPullDownRefresh() {
    this.loadAlbumList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/AlbumDetail/index?id=${id}`
    })
  },

  goToUpload() {
    wx.navigateTo({
      url: '/pages/AlbumUpload/index'
    })
  },

  previewImage(e) {
    const { url, index } = e.currentTarget.dataset
    wx.previewImage({
      current: index,
      urls: this.data.albumList.map(item => item.imageUrl)
    })
  }
})
