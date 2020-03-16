/*
	@ author: leeenx
	@ 消除星星
*/

// 向前兼容
import '@babel/polyfill'; 

import Model from './core/Model.es6'; 
import View from './core/View.es6'; 
import Control from './core/Control.es6'; 

class Popstar {
	constructor(config) { 
		// mvc 初始化
		this.model = new Model(); 
		this.view = new View(config.view); 
		// mv 由于 c 控制
		this.constrol = new Control(
			this.model, 
			this.view, 
			config.total
		); 
		// 挂载 event
		this.event = this.constrol.event; 
		// 总得分
		Reflect.defineProperty(
			this, 
			"total", 
			{
				get: () => this.constrol.total, 
				set: value => this.constrol.total = value
			}
		); 
		// 当前关卡 ---- 只读
		Reflect.defineProperty(
			this, 
			"level", 
			{
				get: () => this.constrol.curLevel
			}
		); 
	}
	// 开始游戏
	enter(level) {
		this.constrol.enter(level); 
	}
	// 下一关
	next() {
		this.constrol.next(); 
	}
	// 暂停
	pause() {
		this.constrol.pause(); 
	}
	// 恢复
	resume() {
		this.constrol.resume(); 
	}
	// 销毁
	destroy() {
		this.constrol.destroy(); 
	}
}

window.Popstar = Popstar; 