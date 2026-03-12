// miniprogram/pages/AlbumDetail/index.js
const app = getApp()

Page({
  data: {
    album: null,
    comments: [],
    loading: true,
    loadError: false,
    currentUserOpenid: '',
    isUploader: false,
    showCommentInput: false,
    commentText: '',
    liked: false,
    likeLoading: false,
    imageError: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadAlbumDetail(id)
    }
  },

  async loadAlbumDetail(id) {
    this.setData({ loading: true, loadError: false, imageError: false })

    try {
      // 获取云数据库
      const db = wx.cloud.database()
      
      // 获取照片详情
      const albumResult = await db.collection('AlbumList').doc(id).get()
      const album = albumResult.data

      // 获取评论
      const commentResult = await db.collection('AlbumComments')
        .where({ albumId: id })
        .orderBy('createTime', 'desc')
        .get()

      // 获取当前用户
      const openid = app.globalData._openidA || app.globalData._openidB

      this.setData({
        album,
        comments: commentResult.data || [],
        currentUserOpenid: openid,
        isUploader: album._openid === openid,
        liked: album.likes && album.likes.includes(openid),
        loading: false,
        loadError: false
      })
    } catch (err) {
      console.error('加载详情失败:', err)
      wx.showToast({
        title: '加载失败，可重试',
        icon: 'none'
      })
      this.setData({ loading: false, loadError: true })
    }
  },

  retryLoad() {
    const { album } = this.data
    if (album && album._id) {
      this.loadAlbumDetail(album._id)
      return
    }
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    const id = current?.options?.id
    if (id) {
      this.loadAlbumDetail(id)
    }
  },

  async toggleLike() {
    const { album, liked, likeLoading } = this.data
    if (!album || likeLoading) return

    const openid = app.globalData._openidA || app.globalData._openidB

    this.setData({ likeLoading: true })
    wx.showLoading({ title: '...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'toggleAlbumLike',
        data: { albumId: album._id }
      })

      if (res.result && res.result.success) {
        const nextLiked = !!res.result.liked
        const nextCount = typeof res.result.likeCount === 'number' ? res.result.likeCount : (album.likeCount || 0)
        const nextLikes = nextLiked
          ? [...(album.likes || []), openid]
          : (album.likes || []).filter(id => id !== openid)

        this.setData({
          liked: nextLiked,
          'album.likeCount': nextCount,
          'album.likes': nextLikes
        })
      } else {
        wx.showToast({
          title: res.result?.error || '操作失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('操作失败:', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ likeLoading: false })
    }
  },

  showCommentBox() {
    this.setData({ showCommentInput: true })
  },

  hideCommentBox() {
    this.setData({ showCommentInput: false, commentText: '' })
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  async submitComment() {
    const { commentText, album } = this.data
    const trimmed = (commentText || '').trim()
    if (!trimmed) {
      wx.showToast({ title: '评论不能为空', icon: 'none' })
      return
    }
    if (trimmed.length > 200) {
      wx.showToast({ title: '评论不能超过200字', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发送中...' })

    try {
      const openid = app.globalData._openidA || app.globalData._openidB
      const userName = openid === app.globalData._openidA ? app.globalData.userA : app.globalData.userB
      const commenterId = openid === app.globalData._openidA ? 'A' : 'B'

      const result = await wx.cloud.callFunction({
        name: 'addAlbumComment',
        data: {
          albumId: album._id,
          content: trimmed,
          commenter: userName,
          commenterId
        }
      })

      if (!result.result || !result.result.success) {
        wx.showToast({
          title: result.result?.error || '评论失败',
          icon: 'none'
        })
        return
      }

      wx.showToast({
        title: '评论成功',
        icon: 'success'
      })

      this.loadAlbumDetail(album._id)
      this.hideCommentBox()
    } catch (err) {
      console.error('评论失败:', err)
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async setAsCover() {
    const { album } = this.data
    if (!album) return

    wx.showLoading({ title: '设置中...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'setAlbumCover',
        data: { albumId: album._id }
      })

      if (!result.result || !result.result.success) {
        wx.showToast({
          title: result.result?.error || '设置失败',
          icon: 'none'
        })
        return
      }

      wx.showToast({
        title: '已设为封面',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      console.error('设置封面失败:', err)
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async deletePhoto() {
    const { album, isUploader } = this.data
    if (!album) return

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            // 调用云函数安全删除
            const result = await wx.cloud.callFunction({
              name: 'deleteAlbumPhoto',
              data: { albumId: album._id }
            })

            if (result.result.success) {
              wx.showToast({ title: '已删除', icon: 'success' })
              setTimeout(() => { wx.navigateBack() }, 1500)
            } else {
              wx.showToast({ title: result.result.error || '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  previewImage() {
    const { album } = this.data
    if (!album) return
    wx.previewImage({
      current: album.imageUrl,
      urls: [album.imageUrl]
    })
  },

  onImageError() {
    this.setData({ imageError: true })
  },

  onShareAppMessage() {
    const { album } = this.data
    return {
      title: album?.content || '我们的照片',
      path: `/pages/AlbumDetail/index?id=${album?._id}`
    }
  }
})
