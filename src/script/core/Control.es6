import Event from '../lib/Event.es6'; 
import timer from '../lib/timer.es6'; 

export default class Constrol {
	constructor (model, view, total = 0) {
		this.model = model, this.view = view; 

		// event 事件
		this.event = new Event(); 

		// view 与 control 共享一个event
		this.view.event = this.event; 

		// 当前总分
		Reflect.defineProperty(this, "total", {
			get: () => this.view.total, 
			set: value => this.view.total = value
		}); 

		// view 与 control 共享一个 timer
		this.view.timer = timer; 

		// 当前关卡
		Object.defineProperties(
			this, 
			{
				"curLevel": {
					get: () => this._curLevel || 0, 
					set: value => {
						this._curLevel = value || 0; 
						this.view.setLevel(this._curLevel + 1); 
					}
				}, 
				"goal": {
					get: () => this._goal || 0, 
					set: value => {
						this._goal = value || 0; 
						this.view.setGoal(value); 
					}
				}
			}
		)

		// 数据绑定: model.tiles -> view.tiles
		model.tiles.forEach(tile => {
			Reflect.defineProperty(tile, "index", {
				set: value => { 
					if(value === tile._index) return false; 
					Reflect.set(tile, "_index", value); 
					// 与view同步数据
					view.update(tile); 
				}, 
				get: () => Reflect.get(tile, "_index")
			}); 

			Reflect.defineProperty(tile, "clr", {
				set: value => { 
					if(value === tile._clr) return false; 
					Reflect.set(tile, "_clr", value); 
					// 与view同步数据
					view.update(tile); 
				}, 
				get: () => Reflect.get(tile, "_clr")
			}); 

			Reflect.defineProperty(tile, "removed", { 
				set: value => { 
					if(value === tile._removed) return false; 
					Reflect.set(tile, "_removed", value); 
					// 与view同步数据
					view.update(tile); 
				}, 
				get: () => Reflect.get(tile, "_removed") || false
			}); 

		}); 

		// 当前分数
		this.total = total; 

		// 监听点击事件
		this.event.on("view-tap", index => {
			// 暂停状态下锁屏
			if(this.paused === true) return; 
			// 消除 model 的砖块
			let count = this.model.clean(index); 
			// 显示边消信息
			count > 0 && this.view.setCleanInfo(count); 
		}); 

		// 清除相邻的同色砖事件
		this.event.on("view-clean", () => {
			// 结束压缩数组
			this.model.tamp(); 
			// 游戏进入死局 ---- 清空剩余的色砖
			if(this.model.check() === false) { 
				this.view.showBountyInfo(this.model.tileCount)
					.then(
						// 显示清空色砖，并计算奖励分数 
						() => this.model.cleanAll()
					) 
			}
		}); 
		// 清空所有的色砖事件
		this.event.on("view-clean-all", () => {
			if(this.total < this.goal) {
				// 游戏结束
				this.event.dispatch("gameover"); 
			}
			// 通关
			else {
				this.event.dispatch("pass"); 
			}
		}); 
		// 按下暂停按钮
		this.event.on("view-press-pause", () => {
			// this.pause(); 
			this.event.dispatch("pause"); 
		}); 
		// 按下播放按钮
		this.event.on("view-press-play", () => {
			// this.resume(); 
			this.event.dispatch("resume"); 
		}); 

	}
	// 初关卡
	init() { 
		// 默认五个颜色
		this.model.init(); 
		// 砖块动画
		this.view.init(); 
	}
	// 销毁 
	destroy() { 
		this.view.destroy(); 
		// 总分数清空
		this.total = 0; 
	}
	// 指定关数
	enter(level = 0) {
		this.curLevel = level || 0; 
		// 目标分数
		this.goal = level * 2000 + 1000; 
		// 初始化关卡
		this.init(); 
	}
	// 下一关
	next() {
		this.enter(this.curLevel + 1); 
	}
	// 暂停游戏
	pause() {
		// 暂停计时
		timer.pause();  
		// 暂停渲染
		this.view.pause(); 
		// 标记暂停
		this.paused = true; 
	}
	// 恢复游戏
	resume() { 
		// 恢复计时
		timer.resume(); 
		// 恢复渲染
		this.view.resume(); 
		// 标记恢复
		this.paused = false; 
	}
}