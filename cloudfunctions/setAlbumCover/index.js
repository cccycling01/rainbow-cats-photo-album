// cloudfunctions/setAlbumCover/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { albumId } = event || {}

  if (!wxContext.OPENID) {
    return { success: false, error: '未授权' }
  }

  if (!albumId) {
    return { success: false, error: '缺少照片ID' }
  }

  try {
    const albumRes = await db.collection('AlbumList').doc(albumId).get()
    const album = albumRes.data

    if (!album) {
      return { success: false, error: '照片不存在' }
    }

    if (album._openid !== wxContext.OPENID) {
      return { success: false, error: '无权限' }
    }

    await db.collection('AlbumList').where({ isCover: true }).update({
      data: { isCover: false }
    })

    await db.collection('AlbumList').doc(albumId).update({
      data: { isCover: true }
    })

    return { success: true }
  } catch (err) {
    console.error('setAlbumCover error:', err)
    return { success: false, error: err.message || '设置失败' }
  }
}
