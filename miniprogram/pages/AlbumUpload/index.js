// miniprogram/pages/AlbumUpload/index.js
const app = getApp()

Page({
  data: {
    selectedImages: [],
    maxImages: 9,
    content: '',
    uploading: false,
    uploadProgress: 0
  },

  onLoad() {},

  chooseImage() {
    const { selectedImages, maxImages } = this.data
    const remaining = maxImages - selectedImages.length

    if (remaining <= 0) {
      wx.showToast({
        title: `最多上传${maxImages}张`,
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(item => ({
          path: item.tempFilePath,
          size: item.size
        }))
        this.setData({
          selectedImages: [...selectedImages, ...newImages]
        })
      }
    })
  },

  removeImage(e) {
    const { index } = e.currentTarget.dataset
    const { selectedImages } = this.data
    selectedImages.splice(index, 1)
    this.setData({ selectedImages })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  async uploadImages() {
    const { selectedImages, content } = this.data

    if (selectedImages.length === 0) {
      wx.showToast({
        title: '请选择照片',
        icon: 'none'
      })
      return
    }

    this.setData({ uploading: true, uploadProgress: 0 })

    const db = wx.cloud.database()
    const openid = app.globalData._openidA || app.globalData._openidB
    const userName = openid === app.globalData._openidA ? app.globalData.userA : app.globalData.userB
    const userId = openid === app.globalData._openidA ? 'A' : 'B'

    let successCount = 0

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i]
        
        // 上传到云存储
        const cloudPath = `album/${openid}/${Date.now()}-${i}.${image.path.split('.').pop()}`
        
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath,
          filePath: image.path
        })

        // 生成缩略图（使用云函数的图片处理，这里简化处理）
        // 实际项目中可以使用云函数生成缩略图

        // 保存到数据库
        await db.collection('AlbumList').add({
          data: {
            _openid: openid,
            uploader: userName,
            uploaderId: userId,
            imageUrl: uploadResult.fileID,
            thumbUrl: uploadResult.fileID, // 简化：使用同一张图
            content: i === 0 ? content : '', // 只在第一张添加描述
            likes: [],
            likeCount: 0,
            commentCount: 0,
            isCover: false,
            createTime: db.serverDate()
          }
        })

        successCount++
        this.setData({
          uploadProgress: Math.round((successCount / selectedImages.length) * 100)
        })
      }

      wx.showToast({
        title: `已上传${successCount}张`,
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (err) {
      console.error('上传失败:', err)
      wx.showToast({
        title: `上传失败(${successCount}/${selectedImages.length})`,
        icon: 'none'
      })
    } finally {
      this.setData({ uploading: false })
    }
  }
})
