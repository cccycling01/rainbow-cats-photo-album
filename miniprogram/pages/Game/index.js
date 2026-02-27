// miniprogram/pages/Game/index.js
const app = getApp()

Page({
  data: {
    currentGame: 'rps',
    myChoice: null,
    computerChoice: null,
    result: null,
    wins: 0,
    losses: 0,
    draws: 0,
    gameHistory: [],
    // 每日问答
    dailyQuestion: { q: '今天是谁先说喜欢的？', a: ['我', 'TA', '同时'] },
    answered: false,
    answerResult: null
  },

  onLoad() { this.loadStats() },

  switchGame(e) {
    const game = e.currentTarget.dataset.game
    this.setData({ 
      currentGame: game,
      myChoice: null,
      computerChoice: null,
      result: null,
      answered: false,
      answerResult: null
    })
  },

  playRPS(e) {
    const choices = ['✊', '✌️', '✋']
    const myChoice = e.currentTarget.dataset.choice
    const computerChoice = choices[Math.floor(Math.random() * 3)]
    
    let result, wins, losses, draws
    const idx = choices.indexOf(myChoice)
    const compIdx = choices.indexOf(computerChoice)
    
    if (idx === compIdx) {
      result = '平局!'
      draws = this.data.draws + 1
      wins = this.data.wins
      losses = this.data.losses
    } else if ((idx - compIdx + 3) % 3 === 1) {
      result = '你赢了! 🎉'
      wins = this.data.wins + 1
      losses = this.data.losses
      draws = this.data.draws
    } else {
      result = '你输了 😅'
      losses = this.data.losses + 1
      wins = this.data.wins
      draws = this.data.draws
    }

    this.setData({
      myChoice, computerChoice, result, wins, losses, draws,
      gameHistory: [{ my: myChoice, comp: computerChoice, result: result }, ...this.data.gameHistory.slice(0, 4)]
    })
  },

  async loadStats() {
    // 从数据库加载统计
    try {
      const db = wx.cloud.database()
      const result = await db.collection('GameStats').where({ _openid: app.globalData._openidA || app.globalData._openidB }).get()
      if (result.data.length > 0) {
        this.setData(result.data[0])
      }
    } catch (err) { console.error(err) }
  },

  answerQuestion(e) {
    const answer = e.currentTarget.dataset.answer
    const correct = answer === this.data.dailyQuestion.a[0]
    this.setData({ 
      answered: true, 
      answerResult: correct ? '答对啦！💕' : '哈哈再想想~' 
    })
  },

  reset() {
    this.setData({
      myChoice: null,
      computerChoice: null,
      result: null
    })
  }
})
