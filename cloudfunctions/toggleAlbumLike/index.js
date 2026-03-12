// cloudfunctions/toggleAlbumLike/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const _ = db.command
  const { albumId } = event || {}

  if (!albumId) {
    return { success: false, error: '缺少照片ID' }
  }

  if (!wxContext.OPENID) {
    return { success: false, error: '未授权' }
  }

  try {
    const albumRes = await db.collection('AlbumList').doc(albumId).get()
    const album = albumRes.data

    if (!album) {
      return { success: false, error: '照片不存在' }
    }

    const likes = Array.isArray(album.likes) ? album.likes : []
    const liked = likes.includes(wxContext.OPENID)
    let nextLikes = []
    let nextLikeCount = Number(album.likeCount) || 0

    if (liked) {
      nextLikes = likes.filter(id => id !== wxContext.OPENID)
      nextLikeCount = Math.max(0, nextLikeCount - 1)
      await db.collection('AlbumList').doc(albumId).update({
        data: {
          likes: nextLikes,
          likeCount: _.inc(-1)
        }
      })
      return { success: true, liked: false, likeCount: nextLikeCount }
    }

    nextLikes = likes.concat(wxContext.OPENID)
    nextLikeCount = nextLikeCount + 1
    await db.collection('AlbumList').doc(albumId).update({
      data: {
        likes: nextLikes,
        likeCount: _.inc(1)
      }
    })
    return { success: true, liked: true, likeCount: nextLikeCount }
  } catch (err) {
    console.error('toggleAlbumLike error:', err)
    return { success: false, error: err.message || '操作失败' }
  }
}
