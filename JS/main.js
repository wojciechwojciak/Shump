let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.Loader.shared,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle

let app = new Application({
    width: 800, 
    height: 600,                       
    antialiasing: true, 
    transparent: false, 
    resolution: 1
})

document.body.appendChild(app.view)

loader
  .add("Ship.png")
  .add("Star.png")
  .add("Shot.png")
  .add("Enemy.png")
  .load(setup)

function setup() {
	let up = keyboard(38),
		left = keyboard(37),
		right = keyboard(39),
		down = keyboard(40),
		space = keyboard(32)
	
	objects = []
	for (i = 0; i < 80; i++) {
		objects.push(star = new Sprite(resources["Star.png"].texture))
		star.x = i * 10
		star.y = Math.random() * 600
		star.update = (star) => {return updateStar(star)}
		app.stage.addChild(star)
	}
	
	ship = new Sprite(resources["Ship.png"].texture)
	app.stage.addChild(ship)
	ship.x = 50
	ship.y = 270
	ship.vx = ship.vy = 0
	ship.fire = false
	ship.reload = 0

	up.press = () => {ship.vy = -4}
	up.release = () => {if (ship.vy < 0) ship.vy = 0}
	down.press = () => {ship.vy = 4}
	down.release = () => {if (ship.vy > 0) ship.vy = 0}
	left.press = () => {ship.vx = -4}
	left.release = () => {if (ship.vx < 0) ship.vx = 0}
	right.press = () => {ship.vx = 4}
	right.release = () => {if (ship.vx > 0) ship.vx = 0}
	space.press = () => {ship.fire = true}
	space.release = () => {ship.fire = false}

	enemyTimer = 0
	enemyCounter = 0
	difficulty = 0
	gameOver = false
	
	score = 0
	scoreText = new Text("0", new TextStyle({
		fontFamily: "sans-serif",
		fontSize: 18,
		fill: "white"
	}))
	scoreText.position.set(400, 20)
	app.stage.addChild(scoreText)

	health = 100
	healthText = new Text("100", new TextStyle({
		fontFamily: "sans-serif",
		fontSize: 18,
		fill: "green"
	}))
	healthText.position.set(40, 20)
	app.stage.addChild(healthText)

	app.ticker.add(delta => gameLoop(delta))
}

function gameLoop(delta) {
	if (gameOver) {
		return
	}

	ship.x = Math.min(Math.max(ship.x + ship.vx, 0), 720)
	ship.y = Math.min(Math.max(ship.y + ship.vy, 0), 540)
	ship.reload--

	scoreText.text = score
	healthText.text = health

	if (health <= 0) {
		gameOver = true
		objects.forEach(object => { app.stage.removeChild(object)})
		app.stage.removeChild(ship)
		app.stage.removeChild(healthText)
		app.stage.removeChild(scoreText)

		text = new Text("GAME OVER\nFinal score: " + score, new TextStyle({
			fontFamily: "sans-serif",
			fontSize: 40,
			fill: "red"
		}))
		text.position.set(100, 100)
		app.stage.addChild(text)

		return
	}

	if (ship.fire && ship.reload <= 0) {
		ship.reload = 10
		objects.push(shot = new Sprite(resources["Shot.png"].texture))
		shot.x = ship.x + 54
		shot.y = ship.y + 20
		shot.playerShot = true
		shot.update = (shot) => {return updateShot(shot)}
		app.stage.addChild(shot)
	}

	enemyTimer--
	if (enemyTimer <= 0 && enemyCounter < 3 + Math.round(difficulty / 10)) {
		enemyTimer = 60 - Math.round(difficulty / 5)
		enemyCounter++
		
		objects.push(enemy = new Sprite(resources["Enemy.png"].texture))
		enemy.update = (enemy) => {return updateEnemy(enemy)}
		enemy.x = 800
		enemy.y = Math.random() * 520
		enemy.hp = 2 + Math.round(difficulty / 15)
		app.stage.addChild(enemy)
	}

	objects = objects.filter(object => { if (!object.update(object)) {
		app.stage.removeChild(object)
		return false
	} else return true })

	objects.push(star = new Sprite(resources["Star.png"].texture))
	star.update = (star) => {return updateStar(star)}
	star.x = 800
	star.y = Math.random() * 600
	app.stage.addChild(star)
}

function updateShot(shot) {
	shot.x += 20
	return shot.x < 800 && shot.playerShot
}

function updateStar(star) {
	star.x -= 10
	return star.x > 0
}

function updateEnemy(enemy) {
	enemy.x -= 4 + difficulty * 0.05
	enemy.y += Math.sin(Date.now() * 0.005) * 2

	if (enemy.attacked) {
		enemy.attacked--
		if (enemy.attacked == 0) enemy.attacked = null
	}

	destroyed = false
	if (enemy.x < -80) {
		destroyed = true
	}

	objects.forEach(o => {
		if (!destroyed && o.playerShot && testHit(enemy, o)) {
			o.playerShot = false
			enemy.hp--
			if (enemy.hp <= 0) {
				score += 100
				difficulty++
				destroyed = true
			}
		}

		if (!destroyed && testHit(enemy, ship)) {
			if (!enemy.attacked) {
				health -= 3 + Math.round(difficulty / 5)
				enemy.attacked = 20
			}
		}
	})

	if (destroyed) {
		enemyCounter--
		return false
	}
	return true
}

function testHit(col1, col2) {
	return (col1.x < col2.x + col2.width && col1.x + col1.width > col2.x && col1.y < col2.y + col2.height && col1.y + col1.height > col2.y)
}

function keyboard(keyCode) {
	var key = {}
	key.code = keyCode
	key.isDown = false
	key.isUp = true
	key.press = undefined
	key.release = undefined
	
	key.downHandler = event => {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press()
			key.isDown = true
			key.isUp = false
		}
		event.preventDefault()
	}

	key.upHandler = event => {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release()
			key.isDown = false
			key.isUp = true
		}
		event.preventDefault()
	}

	window.addEventListener("keydown", key.downHandler.bind(key), false)
	window.addEventListener("keyup", key.upHandler.bind(key), false)
	return key
}