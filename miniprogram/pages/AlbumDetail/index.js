// miniprogram/pages/AlbumDetail/index.js
const app = getApp()

Page({
  data: {
    album: null,
    comments: [],
    loading: true,
    currentUserOpenid: '',
    isUploader: false,
    showCommentInput: false,
    commentText: '',
    liked: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadAlbumDetail(id)
    }
  },

  async loadAlbumDetail(id) {
    this.setData({ loading: true })

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
        loading: false
      })
    } catch (err) {
      console.error('加载详情失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  async toggleLike() {
    const { album, liked } = this.data
    if (!album) return

    const openid = app.globalData._openidA || app.globalData._openidB
    const db = wx.cloud.database()

    wx.showLoading({ title: '...' })

    try {
      if (liked) {
        // 取消点赞
        const newLikes = album.likes.filter(id => id !== openid)
        await db.collection('AlbumList').doc(album._id).update({
          data: {
            likes: newLikes,
            likeCount: db.command.inc(-1)
          }
        })
        this.setData({
          liked: false,
          'album.likeCount': album.likeCount - 1
        })
      } else {
        // 点赞
        const newLikes = [...(album.likes || []), openid]
        await db.collection('AlbumList').doc(album._id).update({
          data: {
            likes: newLikes,
            likeCount: db.command.inc(1)
          }
        })
        this.setData({
          liked: true,
          'album.likeCount': album.likeCount + 1
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
    if (!commentText.trim()) return

    wx.showLoading({ title: '发送中...' })

    try {
      const db = wx.cloud.database()
      const openid = app.globalData._openidA || app.globalData._openidB
      const userName = openid === app.globalData._openidA ? app.globalData.userA : app.globalData.userB

      await db.collection('AlbumComments').add({
        data: {
          albumId: album._id,
          _openid: openid,
          commenter: userName,
          commenterId: openid === app.globalData._openidA ? 'A' : 'B',
          content: commentText.trim(),
          createTime: db.serverDate()
        }
      })

      // 更新评论数
      await db.collection('AlbumList').doc(album._id).update({
        data: { commentCount: db.command.inc(1) }
      })

      wx.showToast({
        title: '评论成功',
        icon: 'success'
      })

      // 刷新评论
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
      const db = wx.cloud.database()
      
      // 先清除之前的封面
      await db.collection('AlbumList').where({
        isCover: true
      }).update({
        data: { isCover: false }
      })

      // 设置新的封面
      await db.collection('AlbumList').doc(album._id).update({
        data: { isCover: true }
      })

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
    if (!isUploader) {
      wx.showToast({
        title: '只能删除自己的照片',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            const db = wx.cloud.database()
            
            // 删除云存储图片
            if (album.imageUrl && album.imageUrl.startsWith('cloud://')) {
              await wx.cloud.deleteFile({
                fileList: [album.imageUrl]
              })
            }
            if (album.thumbUrl && album.thumbUrl.startsWith('cloud://')) {
              await wx.cloud.deleteFile({
                fileList: [album.thumbUrl]
              })
            }

            // 删除数据库记录
            await db.collection('AlbumList').doc(album._id).remove()

            wx.showToast({
              title: '已删除',
              icon: 'success'
            })

            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } catch (err) {
            console.error('删除失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  onShareAppMessage() {
    const { album } = this.data
    return {
      title: album?.content || '我们的照片',
      path: `/pages/AlbumDetail/index?id=${album?._id}`
    }
  }
})
