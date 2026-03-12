// cloudfunctions/createAlbumPhoto/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { imageUrl, thumbUrl, content, uploader, uploaderId } = event || {}

  if (!wxContext.OPENID) {
    return { success: false, error: '未授权' }
  }

  if (!imageUrl) {
    return { success: false, error: '缺少图片' }
  }

  try {
    const result = await db.collection('AlbumList').add({
      data: {
        _openid: wxContext.OPENID,
        uploader: uploader || '匿名',
        uploaderId: uploaderId || '',
        imageUrl,
        thumbUrl: thumbUrl || imageUrl,
        content: content || '',
        likes: [],
        likeCount: 0,
        commentCount: 0,
        isCover: false,
        createTime: db.serverDate()
      }
    })

    return { success: true, id: result._id }
  } catch (err) {
    console.error('createAlbumPhoto error:', err)
    return { success: false, error: err.message || '上传失败' }
  }
}
