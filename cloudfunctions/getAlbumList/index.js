// cloudfunctions/getAlbumList/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const page = Math.max(1, Number(event.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(event.pageSize) || 20))
  const skip = (page - 1) * pageSize

  try {
    const listResult = await db.collection('AlbumList')
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    const coverResult = await db.collection('AlbumList')
      .where({ isCover: true })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()

    let cover = null
    if (coverResult.data && coverResult.data.length > 0) {
      cover = coverResult.data[0]
    } else if (listResult.data && listResult.data.length > 0) {
      cover = listResult.data[0]
    }

    return {
      list: listResult.data || [],
      cover
    }
  } catch (err) {
    console.error('getAlbumList error:', err)
    return { list: [], cover: null, error: err.message }
  }
}
