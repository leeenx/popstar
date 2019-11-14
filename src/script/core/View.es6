import '../lib/pixi.extension';

export default class view {
	constructor(view) { 
		// 高宽比 
		let ratiio = 375 / 603; 
		// 当前高度与 ip6的高度比 
		let ip6Ratio = 1; 
		// 更新宽高比 
		let updateRatio = () => {
			// 浏览器的宽高
			let cw = document.documentElement.clientWidth, ch = document.documentElement.clientHeight; 
			// 横屏
			if(cw > ch) {
				[cw, ch] = [ch, cw]; 
			}
			let curRatio = ch / cw; 
			if(curRatio !== ratiio) {
				ratiio = curRatio; 
				ip6Ratio = ch / 603; 
				this.height = this.width * ratiio; 
				this.app && app.renderer.resize(this.width, this.height); 
			}
		}
		// 界面的宽高
		this.width = 375; 
		this.height = 603; 
		// 按当前浏览器适配
		updateRatio(); 
		// 监听 resize 事件
		window.addEventListener("resize", updateRatio); 

		const app = new PIXI.Application(
			{
				width: this.width, 
				height: this.height, 
				resolution: 2, 
				backgroundColor: 0x333333, 
				view: view
			}
		); 

		// 挂载属性
		Object.assign(this, app); 
		this.ticker = app.ticker; 

		// 原始砖色
		this.originClrs = [
			// 红色
			0xe45c5b,
			// 绿色 
			0x64df6a, 
			// 蓝色
			0x3d91e1, 
			// 黄色
			0xffdf7b, 
			// 紫色
			0xec3ffc
		]

		// 砖块数组
		this.tiles = new Array(100); 

		// 游戏区域
		this.area = new PIXI.Container(); 
		let emptySprite = PIXI.Sprite.from(PIXI.Texture.EMPTY); 
		emptySprite.set({width: this.width, height: this.width}); 
		this.area.addChild(emptySprite); 
		this.area.set({x: .5, y: this.height - this.width}); 

		// 砖块尺寸
		this.tileSize = 36.5; 

		// 表格尺寸
		this.gridWidth = 37.5; 
		this.gridHeight = 37.5; 

		// 表格的行列数
		this.col = this.row = 10; 

		// X轴中心点
		this.centerX = this.width / 2; 

		// 游戏单独一个容器
		this.game = new PIXI.Container(); 

		// 添加到舞台
		this.stage.addChild(this.game); 

		// 添加到舞台 
		this.game.addChild(this.area); 

		// 默认不显示游戏界面
		this.hideGame(); 

		// 添加点击事件
		this.area.on("ontouchstart" in document ? "tap" : "click", (e) => { 
			// 暂停不触发事件
			if(this.paused === true) return; 
			let x = e.data.global.x, y = e.data.global.y - this.area.y; 
			let col = x / this.gridWidth >> 0, row = y / this.gridHeight >> 0; 
			let position = col + row * 10; 
			this.event.dispatch("view-tap", position); 
		}); 

		// 关卡信息
		this.level = new PIXI.Text(
			"关卡：0", 
			{
				fontFamily: "Arial", 
				fontSize: 16, 
				fill: 0xffffff
			}
		); 
		this.level.set({top: 16, left: 16}); 

		// 目标分数 
		this.goal = new PIXI.Text(
			"目标：0", 
			{
				fontFamily: "Arial", 
				fontSize: 16, 
				fill: 0xffffff, 
				align: "center"
			}
		); 

		this.goal.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 25
			}
		); 

		// 当前分数
		this.totalLabel = new PIXI.Text(
			"0", 
			{
				fontFamily: "Arial", 
				fontSize: 24, 
				fill: 0xf7f408, 
				align: "center"
			}
		); 

		this.totalLabel.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 50
			}
		); 

		Reflect.defineProperty(
			this, 
			"total", 
			{
				get: () => this._total || 0, 
				set: value => {
					this._total = value; 
					this.totalLabel.text = value; 
				}
			}
		); 

		// 消除信息
		this.cleanInfo = new PIXI.Text(
			"", 
			{
				fontFamily: "Arial", 
				fontSize: 16, 
				fill: 0xffffff, 
				align: "center"
			}
		); 

		this.cleanInfo.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 78
			}
		); 

		// 奖励信息 
		this.bountyLabel = new PIXI.Text(
			"奖励 ", 
			{
				fontFamily: "Arial",
				fontSize: 16, 
				fill: 0xffffff, 
				align: "center"
			}
		); 
		this.bountyLabel.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 410 * ip6Ratio, 
				defaultTop: 410 * ip6Ratio, 
				renderable: false
			}
		); 

		// 默认的奖励分数 
		this._bounty = 2000; 

		Reflect.defineProperty(
			this, 
			"bounty", 
			{
				get: () => this._bounty, 
				set: value => {
					this._bounty = value; 
					this.bountyLabel.text = "奖励 " + value; 
				}
			}
		); 

		// 剩余星星信息
		this.starInfo = new PIXI.Text(
			"", 
			{
				fontFamily: "Arial", 
				fontSize: 12, 
				fill: 0xffffff, 
				align: "center"
			}
		); 
		this.starInfo.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 435 * ip6Ratio, 
				renderable: false
			}
		); 

		// 进入关卡前的屏幕信息
		this.levelInfo = new PIXI.Container(); 
		this.levelInfo.title = new PIXI.Text(
			"关卡 n", 
			{
				fontFamily: "Arial", 
				fontSize: 30, 
				fill: 0xffffff, 
				align: "center"
			}
		); 
		this.levelInfo.title.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 260 * ip6Ratio
			}
		); 
		this.levelInfo.goal = new PIXI.Text(
			"目标分数 xxxx", 
			{
				fontFamily: "Arial", 
				fontSize: 14, 
				fill: 0xffffff, 
				align: "center"
			}
		); 

		this.levelInfo.goal.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: this.centerX, 
				top: 300 * ip6Ratio
			}
		); 

		this.levelInfo.addChild(
			this.levelInfo.title, 
			this.levelInfo.goal
		); 

		this.game.addChild(
			this.level, 
			this.goal, 
			this.totalLabel, 
			this.cleanInfo, 
			this.bountyLabel, 
			this.starInfo 
		); 

		// 生成砖块 Texture
		this.generateTileTextures(); 

		// 生成星星 Texture
		this.generateStarTextures(); 

		// 爆星队列
		this.bombList = []; 
		// 加载图片
		PIXI.loader
			.add(
				[
					{name: "red", url: require("../../images/red@2x.png")}, 
					{name: "green", url: require("../../images/green@2x.png")}, 
					{name: "blue", url: require("../../images/blue@2x.png")}, 
					{name: "yellow", url: require("../../images/yellow@2x.png")}, 
					{name: "purple", url: require("../../images/purple@2x.png")}, 
					{name: "star_red", url: require("../../images/star_red@2x.png")}, 
					{name: "star_green", url: require("../../images/star_green@2x.png")}, 
					{name: "star_blue", url: require("../../images/star_blue@2x.png")}, 
					{name: "star_yellow", url: require("../../images/star_yellow@2x.png")}, 
					{name: "star_purple", url: require("../../images/star_purple@2x.png")}, 
					{name: "pause", url: require("../../images/pause@2x.png")}, 
					{name: "play", url: require("../../images/play@2x.png")}, 
					{name: "cover", url: require("../../images/cover.jpg")} 
				]
			)
			.load(
				() => { 
					["red", "green", "blue", "yellow", "purple"].forEach(
						(clr, index) => { 
							this.tileTextures[index].baseTexture = PIXI.utils.TextureCache[clr].baseTexture; 
							this.starTextures[index].baseTexture = PIXI.utils.TextureCache["star_" + clr].baseTexture; 
						}
					)
					// 暂停与播放按钮
					let btn = new PIXI.Sprite(PIXI.utils.TextureCache["pause"]); 
					btn.interactive = true; 
					btn.on("ontouchstart" in document ? "tap" : "click", () => { 
						let name = btn.texture.textureCacheIds[0]; 
						this.event.dispatch("view-press-" + name); 
					});
					btn.set({top: 12, left: 325});
					this.game.addChild(btn); 
					this.btn = btn; 
					// 背景图片 
					this.stage.addChildAt(new PIXI.Sprite(PIXI.utils.TextureCache["cover"]), 0); 
				}
			);
	}

	// 初始化
	init() { 
		// 开启 ticker
		this.ticker.started === false && this.ticker.start(); 
		// 隐藏奖励信息 
		this.area.renderable = this.bountyLabel.renderable = this.starInfo.renderable = false; 
		// 显示游戏界面
		this.showGame(); 
		this.showLevelInfo().then(() => {
			// 开启点击
			this.area.interactive = true; 
			// 显示砖块
			this.area.renderable = true; 
			// 做下掉的动画
			for(let len =this.tiles.length, i = len - 1; i >= 0; --i) {
				let tile = this.tiles[i]; 
				TweenMax.from(
					tile.sprite, 
					.5, 
					{
						y: "-=" + (600 - Math.random() * this.gridHeight >> 0), 
						delay: ((len - i) / this.col >> 0) * .05, 
						ease: Linear.easeNone
					}
				)
			} 
		}); 
	}

	// 销毁
	destroy() { 
		this.ticker.stop(); 
		// 清空 timer
		this.timer.clean(); 
		// 暂停状态重置
		this.paused = false; 
		// 隐藏游戏界面
		this.game.renderable = false; 
		this.renderer.render(this.stage); 
	}

	// 显示关卡信息
	showLevelInfo() { 
		this.game.addChild(this.levelInfo);
		return new Promise(
			(resolve, reject) => {
				// 显示当前关卡信息 
				TweenMax.fromTo(
					this.levelInfo, 
					.6, 
					{x: this.width}, 
					{x: 0}
				);
				TweenMax.to(
					this.levelInfo, 
					.6, 
					{
						x: -this.width, 
						delay: 3, 
						onComplete: () => { 
							this.levelInfo.parent.removeChild(this.levelInfo);
							resolve(); 
						}
					}, 
				); 
				TweenMax.fromTo(
					this.levelInfo.goal, 
					.6, 
					{x: this.centerX + this.width}, 
					{x: this.centerX, delay: .6}
				); 
				TweenMax.to(
					this.goal, 
					.15, 
					{
						alpha: 0, 
						delay: 1.2, 
						repeat: 9, 
						yoyo: true, 
						ease: Linear.easeNone
					}
				); 
			}
		); 
	}

	// 生成对应的砖块
	generateTileSprite(clr = 0) { 
		var tile = new PIXI.Sprite(this.tileTextures[clr]); 
		return tile; 
	}

	// 生成对应的星星
	generateStar(clr = 5) {
		var star = new PIXI.Sprite(this.starTextures[clr % 5]); 
		return star; 
	}

	// 更改砖块的颜色
	updateTileClr(tile, clr) {
		if(clr === undefined) return; 
		tile.sprite.texture = this.tileTextures[clr]; 
		tile.clr = clr; 
	}

	// 砖块位置变化 
	updateTileIndex(tile, index) {
		let x = (index % this.col) * this.gridWidth; 
		let y = (index / this.col >> 0) * this.gridHeight; 
		tile.index = index; 
		// 游戏过程，有动画
		TweenMax.to(
			tile.sprite, 
			.08, 
			{x: x, y: y, ease: Linear.easeNone}
		); 
	}

	// 生成砖块的 Texture
	generateTileTextures() { 
		this.tileTextures = this.originClrs.map(
			clr => {
				let tile = new PIXI.Graphics()
					.beginFill(clr)
						.drawRoundedRect(0, 0, this.tileSize, this.tileSize, 6); 
				return tile.generateCanvasTexture();
			}
		);
	}

	// 生成星星的 Texture 
	generateStarTextures() {
		this.starTextures = this.originClrs.map(
			clr => {
				let star = new PIXI.Graphics()
					.beginFill(clr)
						.drawPolygon([20, 0, 26.5, 16, 40, 15, 28, 25, 32, 38, 20, 30, 8, 38, 12, 23, 12, 24, 0, 15, 15, 15]); 
				return star.generateCanvasTexture(); 
			}
		)
	}

	// 更新砖块
	update({originIndex, index, clr, removed, score}) { 
		// 还没有 originIndex 或没有色值，直接不处理
		if(originIndex === undefined || clr === undefined) return ; 
		let tile = this.tiles[originIndex]; 
		// tile 不存在，生成对应砖块
		if(tile === undefined) {
			this.tiles[originIndex] = tile = {
				sprite: this.generateTileSprite(clr), 
				clr: clr, 
				index: index, 
				score: 0, 
				originIndex: originIndex, 
				removed: true 
			}; 
			// 定位
			this.updateTileIndex(tile); 
			// 添加到舞台
			this.area.addChild(tile.sprite); 
		}
		// tile 存在，判断颜色是否一样
		else if(tile.clr !== clr) {
			this.updateTileClr(tile, clr); 
		}
		
		// 当前索引变化 ----- 表示位置也有变化 
		if(tile.index !== index) { 
			this.updateTileIndex(tile, index); 
		}

		// 设置分数
		if(tile.score !== score) {
			tile.score = score; 
		}

		if(tile.removed !== removed) { 
			// 移除或添加当前节点
			true === removed ? this.bomb(tile) : this.area.addChild(tile.sprite); 
			tile.removed = removed; 
		}
	}

	// 消除色砖前的彩花
	bomb(tile) {  
		// 爆炸锁定
		if(this.bombLock === true) { 
			// 存入数组
			this.bombList.push(tile); 
			return ;
		}
		this.bombLock = true; 
		// 砖块的位置
		let {index, clr, sprite, sprite: {x, y}} = tile; 
		// 水平方向 1 向左， -1 向右
		let directionX = 1; 
		for(let i = 0, len = 12; i <= len; ++i) {
			let star = this.generateStar(clr); 
			this.area.addChild(star); 
			directionX *= -1; 
			// 统一设置属性 
			star.set(
				{ 
					origin: [star.width / 2, star.height / 2], 
					top: y, 
					left: x, 
					scaleX: .5, 
					scaleY: .5, 
					alpha: .9, 
					// 水平速度 
					velocityX: (Math.random() * 10 + 1) * directionX, 
					velocityY: Math.random() * 10 - 20, 
					accelerationY: Math.random() + 2
				}
			); 


			// 喷发星星
			TweenMax.to(
				star, 
				1.5, 
				{
					scaleX: .15, 
					scaleY: .15, 
					alpha: .1, 
					time: .6,
					ease: Linear.easeNone, 
					onComplete: () => star.destroy()
				}
			); 
		}

		// 爆下一个砖块的函数 
		let bombNextTile = () => {
			let nextTile = this.bombList.shift(); 
			// 解除锁定 
			this.bombLock = false; 
			// 删除当前砖块
			sprite.parent.removeChild(sprite); 
			if(nextTile !== undefined) {
				this.bomb(nextTile); 
			} 
			// 没砖块了 
			else {
				// 游戏过程
				if(tile.score > 0) {
					this.event.dispatch("view-clean"); 
				}
				// 游戏结束
				else {
					// 奖励分数不为0，奖励文案上提
					if(this.bounty > 0) { 
						// 将分数均分十份
						let bountyStep = this.bounty / 10; 
						TweenMax.to(
							this.bountyLabel, 
							.6, 
							{
								top: 80, 
								onComplete: () => {
									this.timer.setInterval(
										() => {
											this.total += bountyStep; 
											this.bounty -= bountyStep; 
											if(this.bounty === 0) {
												this.timer.delete("bounty"); 
												this.timer.setTimeout(
													() => this.event.dispatch("view-clean-all"), 
													1400
												); 
											} 
										}, 
										80, 
										"bounty"
									); 
								}
							}
						)
					} 
					// 奖励分数为0，直接结束
					else {
						this.timer.setTimeout(
							() => this.event.dispatch("view-clean-all"), 
							1400
						); 
					}
				} 
			}
		}

		// 得分
		if(tile.score > 0) { 
			this.showTileScore(tile); 
		} 
		// 扣除奖励
		else { 
			if(this.bounty > 0) {
				this.bounty += tile.score; 
			}
			// 没有奖励分数后，真接全爆
			else { 
				return bombNextTile(); 
			}
		}
		
		// 爆下一个砖块
		this.timer.setTimeout(bombNextTile, 120); 
	}

	// 显示色砖分数
	showTileScore(tile) {
		let score = new PIXI.Text(
			tile.score, 
			{
				fontFamily: "Arial", 
				fontSize: 32, 
				fill: 0xffffff, 
				align: "center"
			}
		); 
		score.set(
			{
				anchorX: .5, 
				anchorY: .5, 
				x: tile.sprite.x, 
				y: tile.sprite.y
			}
		); 
		TweenMax.to(
			score, 
			.4, 
			{
				x: this.centerX, 
				y: 603 - this.height - 158, 
				scaleX: .5, 
				scaleY: .5, 
				ease: Linear.easeNone, 
				onComplete: () => {
					score.parent.removeChild(score); 
					this.total += tile.score; 
				}
			}
		)
		this.area.addChild(score); 
	}

	// 显示连消信息
	setCleanInfo(count) { 
		this.cleanInfo.tween && this.cleanInfo.tween.kill(); 
		this.cleanInfo.text = `${count}连消 ${count * count * 5}分`; 
		this.cleanInfo.tween = TweenMax.fromTo(
			this.cleanInfo, 
			.3, 
			{
				alpha: 0
			}, 
			{
				alpha: 1, 
				repeat: 1, 
				yoyo: true, 
				repeatDelay: 1
			}
		)
	}

	// 当前关卡的文案 
	setLevel(level) {
		this.level.text = "关卡：" + level; 
		this.levelInfo.title.text = "关卡" + level; 
	}

	// 当前目标分数
	setGoal(goal) {
		this.goal.text = "目标：" + goal; 
		this.levelInfo.goal.text = "目标分数 " + goal; 
	}

	// 显示奖励功能
	showBountyInfo(count) {
		this.bountyLabel.renderable = this.starInfo.renderable = true; 
		this.starInfo.text = `剩余 ${count} 个星星`;
		// 初始化奖励分数
		this.bounty = 2000; 
		// 位置重置
		this.bountyLabel.top = this.bountyLabel.defaultTop; 
		// area 闪一闪
		return new Promise(
			(resolve, reject) => {
				TweenMax.fromTo(
					this.area, 
					.1, 
					{
						alpha: 1
					}, 
					{
						alpha: 0, 
						yoyo: true,  
						repeat: 7, 
						ease: Linear.easeNone, 
						onComplete: () => resolve()
					}
				); 
			}
		); 
	}


	// 不显示游戏界面
	hideGame() {
		this.game.renderable = false; 
	}

	// 显示游戏界面
	showGame() {
		this.game.renderable = true; 
	}

	// 暂停渲染
	pause() {
		// this.stop(); 
		TweenMax.pauseAll(); 
		this.paused = true; 
		this.btn.texture = PIXI.utils.TextureCache["play"]; 
	}
	// 恢复渲染 
	resume() {
		// this.start(); 
		TweenMax.resumeAll(); 
		this.paused = false; 
		this.btn.texture = PIXI.utils.TextureCache["pause"]; 
	}
}