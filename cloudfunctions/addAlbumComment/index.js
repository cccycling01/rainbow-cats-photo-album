// cloudfunctions/addAlbumComment/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { albumId, content, commenter, commenterId } = event || {}

  if (!wxContext.OPENID) {
    return { success: false, error: '未授权' }
  }

  if (!albumId) {
    return { success: false, error: '缺少照片ID' }
  }

  const text = (content || '').trim()
  if (!text) {
    return { success: false, error: '内容为空' }
  }

  try {
    await db.runTransaction(async (transaction) => {
      await transaction.collection('AlbumComments').add({
        data: {
          albumId,
          _openid: wxContext.OPENID,
          commenter: commenter || '匿名',
          commenterId: commenterId || '',
          content: text,
          createTime: db.serverDate()
        }
      })

      await transaction.collection('AlbumList').doc(albumId).update({
        data: {
          commentCount: db.command.inc(1)
        }
      })
    })

    return { success: true }
  } catch (err) {
    console.error('addAlbumComment error:', err)
    return { success: false, error: err.message || '评论失败' }
  }
}
