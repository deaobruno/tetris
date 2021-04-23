window.onload = () => {
  const TETRIS = new Tetris()

  TETRIS.boot()
}

class Drawer {
  squareLength = 20

  constructor(canvas) {
    this.canvas = document.getElementById(canvas)
    this.ctx = this.canvas.getContext('2d')
  }

  draw = () => {
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}

class Tetris {
  pointsElement = document.getElementById('points')
  recordElement = document.getElementById('record')
  interval = 600
  gameStarted = false
  points = 0
  piece = {}
  stage = {}
  merged = {}
  stage = new Stage()
  preview = new Preview()
  merged = new Merged(this.stage, this)
  piece = new Piece(this.stage, this.merged)
  nextPiece = this.piece
  piecePreview = new PiecePreview(this.preview, this.piece)

  boot = () => {
    let interval = this.interval
    let hundredBefore = 0
    let hundredAfter = 0

    this.recordElement.innerText = 0

    const INTERNAL_CALLBACK = (() => {
      return async () => {
        let hundredDiff = hundredAfter - hundredBefore

        hundredBefore = this.getHundred()

        if (!this.gameStarted) {
          this.interval = interval
        }

        if (this.piece.reachedLimit) {
          this.getPiece()
        }

        if (hundredDiff > 0) {
          this.nextLevel()
        }

        await document.addEventListener('keydown', this.gameStarted ? this.piece.keyPush : this.start)

        setTimeout(INTERNAL_CALLBACK, this.interval)

        this.drawInfo()

        if (this.gameStarted && this.piece.topLimit === -2) {
          this.nextPiece = new Piece(this.stage, this.merged)
          this.piecePreview = new PiecePreview(this.preview, this.nextPiece)
        }

        this.piecePreview.drawBlocks()

        hundredAfter = this.getHundred()
      }
    })()

    setTimeout(INTERNAL_CALLBACK, this.interval)
  }

  drawInfo = () => {
    this.stage.draw()
    this.preview.draw()

    if (this.gameStarted) {
      this.drawElements()
    }

    this.pointsElement.innerText = this.points
  }

  getHundred = () => {
    return Math.trunc(this.points / 100)
  }

  nextLevel = () => {
    this.interval -= 45
  }

  getPiece = () => {
    this.merged.join(this.piece, this.piece.color)

    if (this.merged.reachedTop) {
      this.restart()
      return
    }

    document.removeEventListener('keydown', this.piece.keyPush)

    this.piece = this.nextPiece
  }

  drawElements = () => {
    this.piece.drawBlocks()
    this.piece.goDown()
    this.merged.drawBlocks()
  }

  start = () => {
    this.gameStarted = true
  }

  restart = () => {
    const RECORD = parseInt(this.recordElement.innerText)

    this.recordElement.innerText = RECORD > this.points ? RECORD : this.points
    this.points = 0
    this.gameStarted = false
    this.merged = new Merged(this.stage, this)
    this.piece = new Piece(this.stage, this.merged)
    this.nextPiece = this.piece
    this.piecePreview = new PiecePreview(this.preview, this.piece)
  }
}

class Stage extends Drawer {
  x = 0
  y = 0
  width = this.canvas.width
  height = this.canvas.height
  color = '#2c3e50'
  rightLimit = this.width / this.squareLength
  bottomLimit = this.height / this.squareLength

  constructor() {
    super('tetris')
  }
}

class Piece {
  // Inner attributes
  type = Math.floor(Math.random() * 7)
  instance = Math.floor(Math.random() * 3)
  color = ''
  leftLimit = 0
  rightLimit = 0
  bottomLimit = 0
  blocks = []
  // Auxiliar attributes
  speed = 1
  speedX = 0
  speedY = 0
  base = { x: 3, y: -3 }
  reachedLimit = false
  // Auxiliar classes objects
  stage = {}
  merged = {}

  constructor(stage, merged) {
    this.stage = stage
    this.merged = merged

    this.getPiece()
  }

  getPiece = () => {
    const TYPES = [
      {
        color: '#c0392b',
        blocks: [
          [
            // [0,0][1,0][2,0]
            //      [1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            // [0,1][1,1]
            //      [1,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            //      [1,0]
            // [0,1][1,1][2,1]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1][1,1]
            // [0,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#2980b9',
        blocks: [
          [
            // [0,0][1,0][2,0]
            //           [2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            //      [1,1]
            // [0,2][1,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            // [0,0]
            // [0,1][1,1][2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1]
            // [0,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#f39c12',
        blocks: [
          [
            // [0,0][1,0]
            //      [1,1][2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            // [0,1][1,1]
            // [0,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ],
          [
            // [0,0][1,0]
            //      [1,1][2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            // [0,1][1,1]
            // [0,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#8e44ad',
        blocks: [
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ]
        ]
      },
      {
        color: '#d35400',
        blocks: [
          [
            //      [1,0][2,0]
            // [0,1][1,1]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1][1,1]
            //      [1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            //      [1,0][2,0]
            // [0,1][1,1]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1][1,1]
            //      [1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#27ae60',
        blocks: [
          [
            // [0,0][1,0][2,0]
            // [0,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            //      [1,1]
            //      [1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            //           [2,0]
            // [0,1][1,1][2,1]
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1]
            // [0,2][1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#bdc3c7',
        blocks: [
          [
            // [0,0][1,0][2,0][3,0]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 3, y: this.base.y }
          ],
          [
            // [0,0]
            // [0,1]
            // [0,2]
            // [0,3]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x,     y: this.base.y + 3 }
          ],
          [
            // [0,0][1,0][2,0][3,0]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 3, y: this.base.y }
          ],
          [
            // [0,0]
            // [0,1]
            // [0,2]
            // [0,3]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x,     y: this.base.y + 3 }
          ]
        ]
      }
    ]

    const PIECE = TYPES[this.type]

    this.blocks = PIECE.blocks[this.instance]
    this.color = PIECE.color
    this.leftLimit = this.blocks.reduce((min, p) => p.x < min ? p.x : min, this.blocks[0].x)
    this.topLimit = this.blocks.reduce((min, p) => p.y < min ? p.y : min, this.blocks[0].y)
    this.rightLimit = this.blocks.reduce((max, p) => p.x > max ? p.x : max, this.blocks[0].x)
    this.bottomLimit = this.blocks.reduce((max, p) => p.y > max ? p.y : max, this.blocks[0].y)
  }

  drawBlocks = () => {
    this.blocks.map((b) => {
      const BLOCK = new Block('tetris', b.x, b.y, this.color)

      BLOCK.draw()
    })
  }

  keyPush = (event) => {
    switch (event.keyCode) {
      case 37: // left arrow
        this.goLeft()
        break

      case 38: // up arrow
        this.rotate()
        break

      case 39: // right arrow
        this.goRight()
        break

      case 40: // down arrow
        this.goDown()
        break
    }
  }

  rotate = () => {
    if ((this.instance % 2 === 0 && this.rightLimit - this.base.x + this.base.y + 1 > this.stage.bottomLimit) || this.checkNearBlocks('down')) {
      return
    }

    if ((this.instance % 2 != 0 && this.bottomLimit - this.base.y + this.base.x + 1 > this.stage.rightLimit) || this.checkNearBlocks('right')) {
      return
    }

    this.instance++

    if (this.instance > 3) {
      this.instance = 0
    }

    this.getPiece()
  }

  goLeft = () => {
    if ((this.leftLimit <= 0) || this.checkNearBlocks('left')) {
      return
    }

    this.speedX = -this.speed
    this.speedY = 0

    this.movePiece()
  }

  goRight = () => {
    if ((this.rightLimit >= this.stage.rightLimit - 1) || this.checkNearBlocks('right')) {
      return
    }

    this.speedX = this.speed
    this.speedY = 0

    this.movePiece()
  }

  goDown = () => {
    if ((this.bottomLimit >= this.stage.bottomLimit - 1) || this.checkNearBlocks('down')) {
      this.reachedLimit = true
      return
    }

    this.speedX = 0
    this.speedY = this.speed

    this.movePiece()
  }

  movePiece = () => {
    this.base.x += this.speedX
    this.base.y += this.speedY

    this.getPiece()
  }

  checkNearBlocks = (direction) => {
    let nearBlocks = []

    switch(direction) {
      case 'down':
        nearBlocks = this.getBlocks('bottom')
        break

      case 'right':
        nearBlocks = this.getBlocks('right')
        break

      case 'left':
        nearBlocks = this.getBlocks('left')
        break
    }

    const NEXT_LINE = nearBlocks.map((b) => {
      return this.merged.blocks.filter(m => m.x === b.x && m.y === b.y).length > 0
    })

    return NEXT_LINE.filter(block => block === true).length > 0
  }

  getBlocks = (direction) => {
    return this.blocks.map((p) => {
      const NEXT_X = direction === 'bottom' ? p.x : (direction === 'right' ? p.x + 1 : p.x - 1)
      const NEXT_Y = direction !== 'bottom' ? p.y : p.y + 1
      const NEXT_BLOCK = this.blocks.filter(pi => pi.x === NEXT_X && pi.y === NEXT_Y)

      if (NEXT_BLOCK.length > 0) {
        return
      }

      return  { x: NEXT_X, y: NEXT_Y }
    }).filter((n) => { return n != undefined })
  }
}

class Merged {
  pieces = []
  blocks = []
  reachedTop = false
  stage = {}
  tetris = {}

  constructor(stage, tetris) {
    this.stage = stage
    this.tetris = tetris
  }

  join = (piece, color) => {
    if (piece.topLimit <= 0) {
      this.reachedTop = true
      return
    }

    this.pieces.push(piece)
    this.blocks.push(...piece.blocks)

    for (let i = 0; i < this.stage.bottomLimit; i++) {
      const LINE = this.blocks.filter(b => b.y === i)

      if (LINE.length >= this.stage.rightLimit) {
        this.pieces.map((pb) => {
          pb.blocks = pb.blocks.filter(b => b.y != i)
        })

        this.blocks = this.blocks.filter(b => b.y != i)
        this.blocks.map(b => b.y < i ? { x: b.x, y: b.y++ } : { x: b.x, y: b.y })
        this.tetris.points += 10
      }
    }
  }

  drawBlocks = () => {
    this.pieces.map(p => p.drawBlocks())
  }
}

class Preview extends Drawer {
  x = 0
  y = 0
  width = this.canvas.width
  height = this.canvas.height
  color = '#2c3e50'

  constructor() {
    super('preview')
  }
}

class PiecePreview {
  base = { x: 1, y: 1 }

  constructor(preview, piece) {
    const TYPES = [
      {
        color: '#c0392b',
        blocks: [
          [
            // [0,0][1,0][2,0]
            //      [1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            // [0,1][1,1]
            //      [1,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            //      [1,0]
            // [0,1][1,1][2,1]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1][1,1]
            // [0,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#2980b9',
        blocks: [
          [
            // [0,0][1,0][2,0]
            //           [2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            //      [1,1]
            // [0,2][1,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            // [0,0]
            // [0,1][1,1][2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1]
            // [0,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#f39c12',
        blocks: [
          [
            // [0,0][1,0]
            //      [1,1][2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            // [0,1][1,1]
            // [0,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ],
          [
            // [0,0][1,0]
            //      [1,1][2,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            //      [1,0]
            // [0,1][1,1]
            // [0,2]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#8e44ad',
        blocks: [
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            // [0,1][1,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ]
        ]
      },
      {
        color: '#d35400',
        blocks: [
          [
            //      [1,0][2,0]
            // [0,1][1,1]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1][1,1]
            //      [1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            //      [1,0][2,0]
            // [0,1][1,1]
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1][1,1]
            //      [1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#27ae60',
        blocks: [
          [
            // [0,0][1,0][2,0]
            // [0,1]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 }
          ],
          [
            // [0,0][1,0]
            //      [1,1]
            //      [1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ],
          [
            //           [2,0]
            // [0,1][1,1][2,1]
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x + 1, y: this.base.y + 1 },
            { x: this.base.x + 2, y: this.base.y + 1 }
          ],
          [
            // [0,0]
            // [0,1]
            // [0,2][1,2]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x + 1, y: this.base.y + 2 }
          ]
        ]
      },
      {
        color: '#bdc3c7',
        blocks: [
          [
            // [0,0][1,0][2,0][3,0]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 3, y: this.base.y }
          ],
          [
            // [0,0]
            // [0,1]
            // [0,2]
            // [0,3]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x,     y: this.base.y + 3 }
          ],
          [
            // [0,0][1,0][2,0][3,0]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x + 1, y: this.base.y },
            { x: this.base.x + 2, y: this.base.y },
            { x: this.base.x + 3, y: this.base.y }
          ],
          [
            // [0,0]
            // [0,1]
            // [0,2]
            // [0,3]
            { x: this.base.x,     y: this.base.y },
            { x: this.base.x,     y: this.base.y + 1 },
            { x: this.base.x,     y: this.base.y + 2 },
            { x: this.base.x,     y: this.base.y + 3 }
          ]
        ]
      }
    ]

    const PIECE = TYPES[piece.type]

    this.blocks = PIECE.blocks[piece.instance]
    this.color = PIECE.color
  }

  drawBlocks = () => {
    this.blocks.map((b) => {
      const BLOCK = new Block('preview', b.x, b.y, this.color)

      BLOCK.draw()
    })
  }
}

class Block extends Drawer {
  width = this.squareLength - 1
  height = this.squareLength - 1

  constructor(canvas, x, y, color) {
    super(canvas)

    this.x = x * this.squareLength
    this.y = y * this.squareLength
    this.color = color
  }
}