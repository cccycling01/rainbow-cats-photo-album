// cloudfunctions/deleteAlbumPhoto/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command

  const { albumId } = event

  if (!albumId) {
    return { success: false, error: '缺少照片ID' }
  }

  try {
    // 获取照片信息
    const album = await db.collection('AlbumList').doc(albumId).get()

    if (!album.data) {
      return { success: false, error: '照片不存在' }
    }

    // 验证权限：只有上传者可以删除
    if (album.data._openid !== wxContext.OPENID) {
      return { success: false, error: '无权限删除' }
    }

    // 删除云存储图片
    if (album.data.imageUrl && album.data.imageUrl.startsWith('cloud://')) {
      await cloud.deleteFile({
        fileList: [album.data.imageUrl]
      })
    }
    if (album.data.thumbUrl && album.data.thumbUrl.startsWith('cloud://') && album.data.thumbUrl !== album.data.imageUrl) {
      await cloud.deleteFile({
        fileList: [album.data.thumbUrl]
      })
    }

    // 删除数据库记录
    await db.collection('AlbumList').doc(albumId).remove()

    return { success: true }
  } catch (err) {
    console.error('删除失败:', err)
    return { success: false, error: err.message }
  }
}
